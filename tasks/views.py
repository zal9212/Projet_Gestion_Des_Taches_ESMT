from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Task
from .serializers import TaskSerializer
from projects.models import Project
from django.db.models import Q

class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les tâches :
    - GET: retourne les tâches des projets auxquels l'utilisateur a accès.
    - POST: Seul le propriétaire du projet peut créer une tâche.
    - PUT: Le propriétaire OU l'assigné peut modifier (si c'est leur tâche).
    - DELETE: Seul le propriétaire peut supprimer.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'assigned_to', 'project']
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        # Les utilisateurs assignés à un projet ou propriétaire peuvent voir
        return Task.objects.filter(
            Q(project__owner=user) | Q(project__project_members__user=user)
        ).distinct()

    def perform_create(self, serializer):
        # 4a. Seuls les créateurs d’un projet peuvent ajouter des tâches
        project = serializer.validated_data['project']
        if project.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seul le créateur du projet peut ajouter des tâches.")

        task = serializer.save()

        # Notification pour l'utilisateur assigné, si présent
        assigned = task.assigned_to
        if assigned:
            from stats.models import Notification
            Notification.objects.create(
                user=assigned,
                type="assignement",
                message=f"Nouvelle tâche « {task.title} » assignée dans le projet « {task.project.name} »."
            )

    def update(self, request, *args, **kwargs):
        # 4b. Les utilisateurs assignés peuvent uniquement modifier les tâches qui leur sont attribuées
        # ou le propriétaire du projet.
        obj = self.get_object()
        user = request.user
        if not (obj.project.owner == user or obj.assigned_to == user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous n'êtes assigné ni propriétaire pour modifier cette tâche.")

        # Si l'utilisateur n'est pas le propriétaire du projet (donc juste assigné),
        # il ne peut mettre à jour QUE le statut de la tâche.
        if obj.project.owner != user:
            allowed_fields = {'status'}
            data_keys = set(request.data.keys())
            # DRF peut envoyer aussi 'id' ou champs en lecture seule, on les ignore
            read_only_like = {'id', 'created_at', 'updated_at', 'project', 'assigned_to_username'}
            data_keys = {k for k in data_keys if k not in read_only_like}
            if not data_keys.issubset(allowed_fields):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Vous ne pouvez mettre à jour que le statut de vos propres tâches.")

        # Conserver l'ancien état pour savoir quoi notifier
        old_status = obj.status
        old_assigned = obj.assigned_to

        response = super().update(request, *args, **kwargs)

        # Recharger depuis la base puis créer les notifications utiles
        obj.refresh_from_db()
        from stats.models import Notification

        # Changement d'assignation
        if obj.assigned_to and obj.assigned_to != old_assigned:
            Notification.objects.create(
                user=obj.assigned_to,
                type="assignement",
                message=f"Vous avez été assigné(e) à la tâche « {obj.title} » dans le projet « {obj.project.name} »."
            )

        # Changement de statut (ex: terminé)
        if old_status != obj.status and obj.assigned_to:
            Notification.objects.create(
                user=obj.assigned_to,
                type="deadline" if obj.status != "done" else "assignement",
                message=f"Le statut de la tâche « {obj.title} » dans le projet « {obj.project.name} » est passé de {old_status} à {obj.status}."
            )

        return response

    def destroy(self, request, *args, **kwargs):
        # 4a. Seuls les créateurs d’un projet peuvent supprimer des tâches
        obj = self.get_object()
        if obj.project.owner != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seul le créateur du projet peut supprimer cette tâche.")
        return super().destroy(request, *args, **kwargs)
