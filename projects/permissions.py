from rest_framework import permissions

class IsProjectOwner(permissions.BasePermission):
    """
    Seul le propriétaire du projet a accès au projet lui-même pour modification/suppression.
    """
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class IsMemberOrOwner(permissions.BasePermission):
    """
    L'utilisateur doit être le propriétaire ou un membre du projet.
    """
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or obj.project_members.filter(user=request.user).exists()

class IsProjectOwnerForTaskCreation(permissions.BasePermission):
    """
    Pour ajouter/supprimer des tâches d'un projet, il faut être propriétaire du projet.
    """
    def has_permission(self, request, view):
        # Pour POST, le projet-id est passé (via data ou query parameters)
        # Mais le viewset traite cela dans perform_create, donc on vérifie là-bas
        return True

    def has_object_permission(self, request, view, obj):
        # obj est une tâche, on vérifie via task.project.owner
        if request.method in permissions.SAFE_METHODS:
            return obj.project.owner == request.user or obj.assigned_to == request.user
        
        # Pour suppression/modification totale (Seuls les créateurs...)
        if request.method == 'DELETE':
            return obj.project.owner == request.user
        
        # Pour modification, les assignés peuvent aussi (si c'est le statut typiquement)
        # mais la règle 4b dit : "uniquement modifier les tâches qui leur sont attribuées."
        return obj.project.owner == request.user or obj.assigned_to == request.user
