from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, DeleteView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib import messages
from django.db.models import Q
from .models import Task
from projects.models import Project
from django.core.exceptions import PermissionDenied
from stats.models import Notification
import calendar
from datetime import date, timedelta
from django.utils import timezone
from urllib.parse import urlencode


class CalendarView(LoginRequiredMixin, View):
    """Vue calendrier mensuelle affichant les tâches par date de deadline avec export Google Calendar."""

    def get(self, request, *args, **kwargs):
        from django.shortcuts import render
        today = date.today()
        year = int(request.GET.get('year', today.year))
        month = int(request.GET.get('month', today.month))

        # Navigation mois précédent / suivant
        first_day = date(year, month, 1)
        prev = first_day - timedelta(days=1)
        if month == 12:
            next_month, next_year = 1, year + 1
        else:
            next_month, next_year = month + 1, year

        # Tâches de l'utilisateur avec deadline ce mois
        user = request.user
        user_tasks = Task.objects.filter(
            Q(assigned_to=user) | Q(project__owner=user)
        ).distinct()

        tasks_this_month = user_tasks.filter(
            deadline__year=year, deadline__month=month
        ).select_related('project')

        tasks_no_deadline = user_tasks.filter(deadline__isnull=True).select_related('project')

        # Construire l'URL Google Calendar pour chaque tâche
        def gcal_url(task):
            if not task.deadline:
                return '#'
            start = task.deadline.strftime('%Y%m%dT%H%M%SZ')
            end_dt = task.deadline + timedelta(hours=1)
            end = end_dt.strftime('%Y%m%dT%H%M%SZ')
            params = {
                'action': 'TEMPLATE',
                'text': task.title,
                'dates': f'{start}/{end}',
                'details': f'Projet: {task.project.name}\n{task.description or ""}',
                'sf': 'true',
                'output': 'xml',
            }
            return 'https://calendar.google.com/calendar/r/eventnew?' + urlencode(params)

        # Enrichir les tâches avec leur URL GCal
        for task in tasks_this_month:
            task.gcal_url = gcal_url(task)

        # Map date → tâches
        task_map = {}
        for task in tasks_this_month:
            day_key = task.deadline.date()
            task_map.setdefault(day_key, []).append(task)

        # Grille du calendrier (6 semaines max)
        cal = calendar.Calendar(firstweekday=0)  # Lundi en premier
        weeks = cal.monthdatescalendar(year, month)
        calendar_days = []
        for week in weeks:
            for d in week:
                calendar_days.append({
                    'day': d.day,
                    'in_month': d.month == month,
                    'is_today': d == today,
                    'tasks': task_map.get(d, []),
                })

        month_names = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        day_names = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

        return render(request, 'tasks/calendar.html', {
            'calendar_days': calendar_days,
            'month_name': month_names[month - 1],
            'year': year,
            'month': month,
            'prev_month': prev.month,
            'prev_year': prev.year,
            'next_month': next_month,
            'next_year': next_year,
            'day_names': day_names,
            'tasks_no_deadline': tasks_no_deadline,
        })


class TaskListView(LoginRequiredMixin, ListView):
    model = Task
    template_name = 'tasks/task_list.html'
    context_object_name = 'tasks'

    def get_queryset(self):
        user = self.request.user
        # Tâches assignées à l'utilisateur OU dans un projet dont il est le propriétaire
        qs = Task.objects.filter(Q(assigned_to=user) | Q(project__owner=user)).distinct().order_by('deadline')
        
        # Filtres & Recherche
        q = self.request.GET.get('q', '')
        status = self.request.GET.get('status', '')
        project_id = self.request.GET.get('project', '')

        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))
        if status:
            qs = qs.filter(status=status)
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        context['filter_projects'] = Project.objects.filter(Q(project_tasks__assigned_to=user) | Q(owner=user)).distinct()
        return context

class TaskCreateView(LoginRequiredMixin, SuccessMessageMixin, CreateView):
    model = Task
    template_name = 'tasks/task_form.html'
    fields = ['title', 'description', 'status', 'deadline', 'assigned_to']
    success_message = "Tâche créée avec succès."

    def dispatch(self, request, *args, **kwargs):
        self.project = get_object_or_404(Project, pk=self.kwargs['project_id'])
        # Vérification: Seul le créateur du projet ou membre peut ajouter des tâches (Selon req: Seul le créateur peut ajouter des tâches/utilisateurs)
        if self.project.owner != self.request.user:
            raise PermissionDenied("Seul le créateur du projet peut ajouter des tâches.")
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        # Assigner la tâche au projet courant
        form.instance.project = self.project
        
        # Logique req: Les étudiants ne peuvent pas associer un professeur à une tache
        user = self.request.user
        assigned_user = form.cleaned_data.get('assigned_to')
        
        if user.role == 'etudiant' and assigned_user and assigned_user.role == 'professeur':
            form.add_error('assigned_to', "Un étudiant ne peut pas assigner une tâche à un professeur.")
            return self.form_invalid(form)
            
        response = super().form_valid(form)
        
        # Auto-add assigned user to project members if not already owner or member
        if assigned_user and assigned_user != self.project.owner:
            from projects.models import ProjectMember
            ProjectMember.objects.get_or_create(project=self.project, user=assigned_user)

        # Notification pour l'utilisateur assigné
        if assigned_user:
            Notification.objects.create(
                user=assigned_user,
                type="assignement",
                message=f"Nouvelle tâche « {self.object.title} » assignée dans le projet « {self.project.name } »."
            )
            
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['project'] = self.project
        
        # Récupérer tous les utilisateurs pour l'assignation
        from accounts.models import User
        users = User.objects.all()
        
        # Règle ESMT: Les étudiants ne peuvent pas assigner à des professeurs
        if self.request.user.role == 'etudiant':
            users = users.exclude(role='professeur')
            
        context['all_users'] = users
        return context

    def get_success_url(self):
        return reverse_lazy('project_detail', kwargs={'pk': self.project.pk})

class TaskUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Task
    template_name = 'tasks/task_form.html'
    fields = ['title', 'description', 'status', 'deadline', 'assigned_to']
    success_message = "Tâche mise à jour."

    def get_queryset(self):
        # Seul le propriétaire du projet peut accéder au formulaire d'édition complète
        user = self.request.user
        return Task.objects.filter(project__owner=user)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        project = self.get_object().project
        context['project'] = project
        
        # Récupérer tous les utilisateurs pour l'assignation
        from accounts.models import User
        users = User.objects.all()
        
        # Règle ESMT: Les étudiants ne peuvent pas assigner à des professeurs
        if self.request.user.role == 'etudiant':
            users = users.exclude(role='professeur')
            
        context['all_users'] = users
        return context

    def form_valid(self, form):
        task = self.get_object()
        user = self.request.user
        
        # Vérification de permission
        if not (task.project.owner == user or (task.assigned_to == user and user.role != 'etudiant')):
             # Remarque: un etudiant assigné peut uniquement modifier le statut (pour simplifier on laisse la gestion des champs globaux ici)
             pass

        # Logique req: Les étudiants ne peuvent pas associer un professeur
        assigned_user = form.cleaned_data.get('assigned_to')
        if user.role == 'etudiant' and assigned_user and assigned_user.role == 'professeur':
            form.add_error('assigned_to', "Un étudiant ne peut pas assigner une tâche à un professeur.")
            return self.form_invalid(form)

        old_status = task.status
        old_assigned = task.assigned_to

        response = super().form_valid(form)
        
        # Auto-add assigned user to project members if changed
        if assigned_user and assigned_user != task.project.owner:
            from projects.models import ProjectMember
            ProjectMember.objects.get_or_create(project=task.project, user=assigned_user)

        # Notifications : changement d'assignation
        if assigned_user and assigned_user != old_assigned:
            Notification.objects.create(
                user=assigned_user,
                type="assignement",
                message=f"Vous avez été assigné(e) à la tâche « {task.title} » dans le projet « {task.project.name} »."
            )

        # Notifications : changement de statut
        if old_status != task.status and task.assigned_to:
            Notification.objects.create(
                user=task.assigned_to,
                type="deadline" if task.status != "done" else "assignement",
                message=f"Le statut de la tâche « {task.title} » dans le projet « {task.project.name} » est passé de {old_status} à {task.status}."
            )

        return response

    def get_success_url(self):
        return reverse_lazy('project_detail', kwargs={'pk': self.object.project.pk})


class TaskStatusUpdateView(LoginRequiredMixin, View):
    """Permet à l'utilisateur assigné de modifier uniquement le statut de sa tâche."""

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if task.assigned_to != request.user:
            raise PermissionDenied("Seul l'utilisateur assigné peut modifier le statut.")
        new_status = request.POST.get('status')
        if new_status not in ('todo', 'in_progress', 'done'):
            messages.error(request, "Statut invalide.")
            return redirect('project_detail', pk=task.project.pk)
        old_status = task.status
        task.status = new_status
        task.save()
        if old_status != new_status:
            Notification.objects.create(
                user=task.assigned_to,
                type="deadline" if new_status != "done" else "assignement",
                message=f"Le statut de la tâche « {task.title} » est passé à {new_status}."
            )
        messages.success(request, "Statut mis à jour.")
        return redirect('project_detail', pk=task.project.pk)


class TaskValidateView(LoginRequiredMixin, View):
    """Le propriétaire du projet valide une tâche terminée ; elle comptera pour les primes."""

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        if task.project.owner != request.user:
            raise PermissionDenied("Seul le propriétaire du projet peut valider une tâche.")
        if task.status != 'done':
            messages.error(request, "Seules les tâches terminées peuvent être validées.")
            return redirect('project_detail', pk=task.project.pk)
        if task.validated_at:
            messages.info(request, "Cette tâche est déjà validée.")
            return redirect('project_detail', pk=task.project.pk)
        from django.utils import timezone
        task.validated_at = timezone.now()
        task.validated_by = request.user
        task.save()
        if task.assigned_to:
            Notification.objects.create(
                user=task.assigned_to,
                type="assignement",
                message=f"La tâche « {task.title } » a été validée par le propriétaire du projet. Elle compte pour vos statistiques et primes."
            )
        messages.success(request, "Tâche validée. Elle sera comptabilisée pour les primes.")
        return redirect('project_detail', pk=task.project.pk)


class TaskDeleteView(LoginRequiredMixin, SuccessMessageMixin, DeleteView):
    model = Task
    template_name = 'tasks/task_confirm_delete.html'
    success_message = "Tâche supprimée."

    def get_queryset(self):
        # Seul le propriétaire du projet peut supprimer une tâche
        user = self.request.user
        return Task.objects.filter(project__owner=user)

    def get_success_url(self):
        return reverse_lazy('project_detail', kwargs={'pk': self.object.project.pk})
