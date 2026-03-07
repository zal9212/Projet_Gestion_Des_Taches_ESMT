from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Stats, Prime, Notification
from .serializers import StatsSerializer, PrimeSerializer, NotificationSerializer
from tasks.models import Task
from accounts.models import User
from django.utils import timezone
from django.db.models import Count, Q
from decimal import Decimal

class StatsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Stats.objects.all()
    serializer_class = StatsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'professeur':
            # Les professeurs peuvent voir leurs propres stats
            return Stats.objects.filter(user=user)
        # Par défaut, on retourne tout pour l'admin ou on peut filtrer selon les besoins
        return Stats.objects.all()

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_stats(self, request):
        """
        Génère les statistiques trimestrielles ET annuelles.
        Seul un propriétaire de projet peut déclencher cette action.
        - Un professeur propriétaire génère ses propres stats.
        - Un autre propriétaire génère les stats des professeurs assignés dans ses projets.
        """
        user = request.user
        
        # Vérifier que l'utilisateur est propriétaire d'au moins un projet
        from projects.models import Project
        owned_projects = Project.objects.filter(owner=user)
        
        if not owned_projects.exists():
            return Response(
                {"error": "Seuls les propriétaires de projets peuvent générer les statistiques et primes."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if user.role == 'professeur':
            users_to_process = [user]
        else:
            # Trouver les professeurs assignés à des tâches dans les projets de cet utilisateur
            prof_ids = Task.objects.filter(
                project__in=owned_projects,
                assigned_to__role='professeur'
            ).values_list('assigned_to', flat=True).distinct()
            users_to_process = list(User.objects.filter(id__in=prof_ids))
            
            if not users_to_process:
                return Response(
                    {"message": "Aucun professeur n'est assigné à des tâches dans vos projets."},
                    status=status.HTTP_200_OK
                )

        now = timezone.now()
        year = now.year
        quarter = (now.month - 1) // 3 + 1

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
            completed_q = tasks_q.filter(status='done', validated_at__isnull=False).count()
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
            completed_y = tasks_y.filter(status='done', validated_at__isnull=False).count()
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

        return Response({"message": "Statistiques trimestrielles et annuelles générées avec succès."}, status=status.HTTP_200_OK)

class PrimeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Prime.objects.all()
    serializer_class = PrimeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'professeur':
            return Prime.objects.filter(user=user)
        return Prime.objects.all()

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'notification marquée comme lue'})
