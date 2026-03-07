from projects.models import Project
from django.db.models import Q

def projects_processor(request):
    if request.user.is_authenticated:
        user = request.user
        # Récupère tous les projets dont l'utilisateur est propriétaire ou membre
        projects = Project.objects.filter(Q(owner=user) | Q(project_members__user=user)).distinct()[:5]
        return {'sidebar_projects': projects}
    return {}
