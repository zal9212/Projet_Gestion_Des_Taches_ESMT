from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib import messages
from django.db.models import Q, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from .models import Project, ProjectMember
from tasks.models import Task
from .forms import ProjectMemberAddForm
from accounts.models import User


# ─── Page d'Accueil Publique ─────────────────────────────────────────────────
class LandingView(View):
    """Page d'accueil visible avant connexion. Redirige vers le dashboard si déjà connecté."""
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('dashboard')
        return render(request, 'landing.html')


class DashboardView(LoginRequiredMixin, ListView):
    model = Project
    template_name = 'projects/dashboard.html'
    context_object_name = 'projects'
    login_url = '/'

    def get_queryset(self):
        # Affiche les projets dont l'utilisateur est propriétaire ou membre
        user = self.request.user
        return Project.objects.filter(Q(owner=user) | Q(project_members__user=user)).distinct()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        
        # Statistiques Globales
        all_user_projects = context['projects']
        all_tasks = Task.objects.filter(project__in=all_user_projects).select_related('project', 'assigned_to')
        
        # Statistiques Personnelles (ce qui concerne l'utilisateur directement)
        context['stats'] = {
            'total_projects': all_user_projects.count(),
            'total_tasks': all_tasks.filter(assigned_to=user).count(),
            'tasks_done': all_tasks.filter(assigned_to=user, status='done').count(),
            'tasks_todo': all_tasks.filter(assigned_to=user, status='todo').count(),
            'tasks_in_progress': all_tasks.filter(assigned_to=user, status='in_progress').count(),
            'my_assigned_tasks': all_tasks.filter(assigned_to=user).count(),
        }

        # Système de filtres pour les tâches du tableau de bord
        status_filter = self.request.GET.get('status')
        user_filter = self.request.GET.get('assigned_to')
        
        # Récupère les tâches filtrées (Uniquement celles qui me concernent : assignées ou projet possédé)
        tasks_qs = all_tasks.filter(Q(assigned_to=user) | Q(project__owner=user)).distinct().order_by('-deadline')
        if status_filter:
            tasks_qs = tasks_qs.filter(status=status_filter)
        if user_filter:
            tasks_qs = tasks_qs.filter(assigned_to_id=user_filter)
        tasks_list = list(tasks_qs)
        
        # Projets avec leurs tâches associées (filtrées)
        projects_with_tasks = []
        for project in all_user_projects:
            project_tasks = [t for t in tasks_list if t.project_id == project.id]
            projects_with_tasks.append({'project': project, 'tasks': project_tasks})
        
        # Utilisateurs assignés (pour le filtre dropdown) - Limités à ceux visibles dans cette vue personnelle
        assignee_ids = tasks_qs.exclude(assigned_to__isnull=True).values_list('assigned_to', flat=True).distinct()
        context['assignable_users'] = User.objects.filter(id__in=assignee_ids).order_by('username')
        
        # Graphique contributions type GitHub (tâches terminées par l'UTILISATEUR uniquement)
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=52 * 7)
        all_done_tasks = Task.objects.filter(
            assigned_to=user,
            status='done',
            completed_at__isnull=False,
            completed_at__date__gte=start_date,
            completed_at__date__lte=end_date
        )
        per_day = all_done_tasks.annotate(day=TruncDate('completed_at')).values('day').annotate(count=Count('id'))
        contributions = {str(d['day']): d['count'] for d in per_day}
        total_contrib = sum(contributions.values())
        contrib_grid = []
        for col in range(53):
            week = []
            for row in range(7):
                d = start_date + timedelta(days=col * 7 + row)
                if d > end_date:
                    week.append({'count': 0, 'level': 0})
                else:
                    c = contributions.get(str(d), 0)
                    level = 0 if c == 0 else (1 if c == 1 else (2 if c <= 2 else (3 if c <= 4 else 4)))
                    week.append({'count': c, 'level': level})
            contrib_grid.append(week)
        mois_abbr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
        month_for_col = [''] * 53
        seen = set()
        for col in range(53):
            week_start = start_date + timedelta(days=col * 7)
            m = week_start.month
            if m not in seen:
                seen.add(m)
                month_for_col[col] = mois_abbr[m - 1]
        context['dashboard_contrib_rows'] = [[contrib_grid[col][row] for col in range(53)] for row in range(7)]
        context['dashboard_contrib_month_for_col'] = month_for_col
        context['dashboard_contrib_total'] = total_contrib
        
        context['projects_with_tasks'] = projects_with_tasks
        context['status_filter'] = status_filter
        context['user_filter'] = user_filter
        return context

class ProjectListView(LoginRequiredMixin, ListView):
    model = Project
    template_name = 'projects/project_list.html'
    context_object_name = 'projects'

    def get_queryset(self):
        user = self.request.user
        qs = Project.objects.filter(Q(owner=user) | Q(project_members__user=user)).distinct().order_by('-created_at')
        q = self.request.GET.get('q', '')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
        return qs

class ProjectCreateView(LoginRequiredMixin, SuccessMessageMixin, CreateView):
    model = Project
    template_name = 'projects/project_form.html'
    fields = ['name', 'description']
    success_url = reverse_lazy('dashboard')
    success_message = "Projet créé avec succès."

    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)

class ProjectDetailView(LoginRequiredMixin, DetailView):
    model = Project
    template_name = 'projects/project_detail.html'

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(Q(owner=user) | Q(project_members__user=user)).distinct()

class ProjectUpdateView(LoginRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Project
    template_name = 'projects/project_form.html'
    fields = ['name', 'description']
    success_message = "Projet mis à jour."

    def get_queryset(self):
        # Seul le propriétaire peut modifier
        return Project.objects.filter(owner=self.request.user)
    
    def get_success_url(self):
        return reverse_lazy('project_detail', kwargs={'pk': self.object.pk})

class ProjectDeleteView(LoginRequiredMixin, SuccessMessageMixin, DeleteView):
    model = Project
    template_name = 'projects/project_confirm_delete.html'
    success_url = reverse_lazy('dashboard')
    success_message = "Projet supprimé."

    def get_queryset(self):
        # Seul le propriétaire peut supprimer
        return Project.objects.filter(owner=self.request.user)

class ProjectMemberCreateView(LoginRequiredMixin, SuccessMessageMixin, CreateView):
    model = ProjectMember
    form_class = ProjectMemberAddForm
    template_name = 'projects/member_form.html'
    success_message = "Membre ajouté."

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['project'] = get_object_or_404(Project, pk=self.kwargs.get('pk'), owner=self.request.user)
        return kwargs

    def form_valid(self, form):
        project = get_object_or_404(Project, pk=self.kwargs.get('pk'), owner=self.request.user)
        form.instance.project = project
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('project_detail', kwargs={'pk': self.kwargs.get('pk')})


class ProjectInviteView(LoginRequiredMixin, View):
    """
    Invitation rapide depuis l'annuaire des membres.
    Ajoute un utilisateur au projet via ProjectMember (POST).
    """

    def post(self, request, *args, **kwargs):
        project_id = request.POST.get('project_id')
        user_id = request.POST.get('user_id')

        if not project_id or not user_id:
            messages.error(request, "Projet ou membre invalide.")
            return redirect('member_directory')

        project = get_object_or_404(Project, pk=project_id, owner=request.user)
        user = get_object_or_404(User, pk=user_id)

        if user == project.owner:
            messages.error(request, "Vous ne pouvez pas vous inviter vous-même.")
            return redirect('member_directory')

        obj, created = ProjectMember.objects.get_or_create(project=project, user=user)
        if created:
            messages.success(request, f"{user.display_name} a été ajouté au projet “{project.name}”.")
        else:
            messages.info(request, f"{user.display_name} est déjà membre du projet “{project.name}”.")

        return redirect('member_directory')

class ProjectMemberDeleteView(LoginRequiredMixin, SuccessMessageMixin, DeleteView):
    model = ProjectMember
    template_name = 'projects/member_confirm_delete.html'
    success_message = "Membre retiré."

    def get_queryset(self):
        # Seul le propriétaire du projet peut retirer des membres
        return ProjectMember.objects.filter(project__owner=self.request.user)

    def get_success_url(self):
        return reverse_lazy('project_detail', kwargs={'pk': self.object.project.pk})

