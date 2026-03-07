from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectMemberSerializer
from .permissions import IsMemberOrOwner, IsProjectOwner

class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les projets :
    - GET: retourne les projets où l'utilisateur est membre ou propriétaire.
    - POST: l'utilisateur authentifié est automatiquement l'owner.
    - PUT/DELETE: restreint à l'owner.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsMemberOrOwner]

    def get_queryset(self):
        user = self.request.user
        # 5b. Tableau de bord affiche projets et tâches associés
        return Project.objects.filter(Q(owner=user) | Q(project_members__user=user)).distinct()
    
    def get_permissions(self):
        # Seul le propriétaire peut modifier ou supprimer (PUT, PATCH, DELETE)
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsProjectOwner()]
        return super().get_permissions()

class ProjectMemberViewSet(viewsets.ModelViewSet):
    """
    Gère les membres d'un projet.
    Seul le propriétaire du projet peut ajouter ou supprimer des membres.
    """
    serializer_class = ProjectMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtre les membres par projet dont on est propriétaire ou membre
        user = self.request.user
        return ProjectMember.objects.filter(
            Q(project__owner=user) | Q(project__project_members__user=user)
        ).distinct()

    def perform_create(self, serializer):
        # Vérification: seul le créateur peut ajouter des membres
        project = serializer.validated_data['project']
        if project.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seul le créateur du projet peut ajouter des membres.")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        # Vérification: seul le créateur peut supprimer des membres
        obj = self.get_object()
        if obj.project.owner != request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seul le créateur du projet peut supprimer des membres.")
        return super().destroy(request, *args, **kwargs)