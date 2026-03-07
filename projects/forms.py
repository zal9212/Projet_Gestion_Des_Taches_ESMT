from django import forms
from .models import ProjectMember
from accounts.models import User

class ProjectMemberAddForm(forms.ModelForm):
    class Meta:
        model = ProjectMember
        fields = ['user']
    
    def __init__(self, *args, **kwargs):
        project = kwargs.pop('project', None)
        super().__init__(*args, **kwargs)
        if project:
            # Exclure les utilisateurs déjà membres
            existing_members = project.project_members.values_list('user_id', flat=True)
            self.fields['user'].queryset = User.objects.exclude(id__in=existing_members).exclude(id=project.owner.id)
