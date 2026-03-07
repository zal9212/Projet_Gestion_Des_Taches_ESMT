from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from .models import Stats, Prime, Notification
from tasks.models import Task
from accounts.models import User
from django.utils import timezone
from django.db.models import Q, Count
from django.db.models.functions import TruncDate
from decimal import Decimal
from datetime import timedelta

from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

class StatsPrimesView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = 'stats/stats_primes.html'

    def test_func(self):
        return self.request.user.role == 'professeur'
    
    def handle_no_permission(self):
        if self.request.user.is_authenticated:
            messages.error(self.request, "Accès refusé. Cette section est réservée aux professeurs.")
            return redirect('dashboard')
        return super().handle_no_permission()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        
        # Si c'est un enseignant, on montre ses propres stats + graphique de contributions
        if user.role == 'professeur':
            context['my_stats_trimestrial'] = Stats.objects.filter(user=user, period_type='trimestriel').order_by('-year', '-quarter')
            context['my_stats_annual'] = Stats.objects.filter(user=user, period_type='annuel').order_by('-year')
            context['my_primes'] = Prime.objects.filter(user=user).order_by('-year')
            # Graphique type GitHub : tâches terminées par jour (date de complétion)
            # On utilise completed_at pour que les tâches apparaissent dès que l'utilisateur les marque "terminée"
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=52 * 7)
            tasks = Task.objects.filter(
                assigned_to=user,
                status='done',
                completed_at__isnull=False,
                completed_at__date__gte=start_date,
                completed_at__date__lte=end_date
            )
            per_day = tasks.annotate(day=TruncDate('completed_at')).values('day').annotate(count=Count('id'))
            contributions = {str(d['day']): d['count'] for d in per_day}
            total_contributions = sum(contributions.values())
            # Grille 53 semaines x 7 jours
            contribution_grid = []
            for col in range(53):
                week = []
                for row in range(7):
                    d = start_date + timedelta(days=col * 7 + row)
                    if d > end_date:
                        week.append({'count': 0, 'level': 0})
                    else:
                        c = contributions.get(str(d), 0)
                        if c == 0: level = 0
                        elif c == 1: level = 1
                        elif c <= 2: level = 2
                        elif c <= 4: level = 3
                        else: level = 4
                        week.append({'count': c, 'level': level})
                contribution_grid.append(week)
            # Labels des mois (première occurrence de chaque mois)
            mois_abbr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
            month_labels = []
            month_for_col = [''] * 53
            seen = set()
            for col in range(53):
                week_start = start_date + timedelta(days=col * 7)
                m = week_start.month
                if m not in seen:
                    seen.add(m)
                    month_labels.append((mois_abbr[m - 1], col))
                    month_for_col[col] = mois_abbr[m - 1]
            context['contribution_grid'] = contribution_grid
            context['contribution_month_labels'] = month_labels
            context['contribution_month_for_col'] = month_for_col
            context['contribution_total'] = total_contributions
            context['contribution_start_date'] = start_date
            context['contribution_end_date'] = end_date
            # Transposer pour affichage : 7 lignes (jours) x 53 colonnes (semaines)
            context['contribution_rows'] = [[contribution_grid[col][row] for col in range(53)] for row in range(7)]
        
        # Si c'est un étudiant (ou admin), on peut potentiellement voir les stats globales
        context['all_stats'] = Stats.objects.all().order_by('-year', 'user')
        context['all_primes'] = Prime.objects.all().order_by('-year', 'user')
        
        return context

def generate_stats_view(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    user = request.user
    
    # Vérifier que l'utilisateur est propriétaire d'au moins un projet
    from projects.models import Project
    from django.db.utils import OperationalError

    owned_projects = Project.objects.filter(owner=user)
    
    if not owned_projects.exists():
        messages.error(request, "Seuls les propriétaires de projets peuvent générer les statistiques et primes.")
        return redirect('stats_primes')
    
    # Si le user est professeur, on génère ses propres stats
    # Si le user est propriétaire de projet, on génère les stats des professeurs
    # assignés à des tâches dans SES projets uniquement
    if user.role == 'professeur':
        users_to_process = [user]
    else:
        # Trouver les professeurs qui ont des tâches dans les projets de cet utilisateur
        prof_ids = Task.objects.filter(
            project__in=owned_projects,
            assigned_to__role='professeur'
        ).values_list('assigned_to', flat=True).distinct()
        users_to_process = list(User.objects.filter(id__in=prof_ids))
        
        if not users_to_process:
            messages.warning(request, "Aucun professeur n'est assigné à des tâches dans vos projets.")
            return redirect('stats_primes')

    now = timezone.now()
    year = now.year
    quarter = (now.month - 1) // 3 + 1

    try:
        for u in users_to_process:
            # --- Stats TRIMESTRIELLES ---
            q_start_month = (quarter - 1) * 3 + 1
            q_end_month   = quarter * 3
            tasks_q = Task.objects.filter(
                assigned_to=u,
                deadline__year=year,
                deadline__month__gte=q_start_month,
                deadline__month__lte=q_end_month
            )
            total_q     = tasks_q.count()
            completed_q = tasks_q.filter(status='done').count()
            rate_q      = (completed_q / total_q * 100) if total_q > 0 else 0

            Stats.objects.update_or_create(
                user=u, period_type='trimestriel', year=year, quarter=quarter,
                defaults={
                    'total_tasks': total_q,
                    'completed_tasks': completed_q,
                    'completion_rate': Decimal(str(round(rate_q, 2))),
                    'generated_at': now
                }
            )

            # --- Stats ANNUELLES ---
            tasks_y     = Task.objects.filter(assigned_to=u, deadline__year=year)
            total_y     = tasks_y.count()
            completed_y = tasks_y.filter(status='done').count()
            rate_y      = (completed_y / total_y * 100) if total_y > 0 else 0

            Stats.objects.update_or_create(
                user=u, period_type='annuel', year=year, quarter=None,
                defaults={
                    'total_tasks': total_y,
                    'completed_tasks': completed_y,
                    'completion_rate': Decimal(str(round(rate_y, 2))),
                    'generated_at': now
                }
            )

            # --- Logique des primes (uniquement pour les professeurs) ---
            if u.role == 'professeur':
                amount = 0
                if rate_y == 100:
                    amount = 100
                elif rate_y >= 90:
                    amount = 30

                prime, created = Prime.objects.update_or_create(
                    user=u, year=year,
                    defaults={
                        'amount': Decimal(str(amount)),
                        'completion_rate': Decimal(str(round(rate_y, 2)))
                    }
                )
                if created and amount > 0:
                    Notification.objects.create(
                        user=u,
                        message=f"Félicitations ! Prime de {amount}k CFA attribuée pour {rate_y:.1f}% de tâches terminées en {year}.",
                        type='prime'
                    )

    except OperationalError as e:
        if 'full' in str(e).lower() or 'disk' in str(e).lower():
            messages.error(
                request,
                "Espace disque ou base de données saturé. Libérez de l'espace sur le disque, puis dans un terminal "
                "lancez : python manage.py vacuum_db"
            )
        else:
            messages.error(request, f"Erreur base de données : {e}")
        return redirect('stats_primes')

    messages.success(request, "Les statistiques et primes ont été mises à jour.")
    return redirect('stats_primes')
