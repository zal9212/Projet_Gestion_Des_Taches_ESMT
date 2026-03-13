from rest_framework import serializers
from .models import Task
from accounts.models import User
from projects.models import Project

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.ReadOnlyField(source='assigned_to.username')
    project_name = serializers.ReadOnlyField(source='project.name')

    class Meta:
        model = Task
        fields = ['id', 'project', 'project_name', 'title', 'description', 'status', 'deadline', 'assigned_to', 'assigned_to_username', 'completed_at', 'validated_at', 'validated_by']
        read_only_fields = ['completed_at', 'validated_at', 'validated_by']

    def validate(self, data):
        """
        Custom validation for task assignment rules.
        """
        request = self.context.get('request')
        if not request: return data

        user = request.user
        assigned_user = data.get('assigned_to')
        
        # d. Les étudiants ne peuvent pas associer un professeur à une tache
        if user.role == 'etudiant' and assigned_user and assigned_user.role == 'professeur':
            raise serializers.ValidationError({"assigned_to": "Un étudiant ne peut pas assigner une tâche à un professeur."})

        # Ensure assigned_to is a member of the project or the owner
        project = data.get('project')
        if project and assigned_user:
            is_owner = project.owner == assigned_user
            is_member = project.project_members.filter(user=assigned_user).exists()
            if not (is_owner or is_member):
                raise serializers.ValidationError({"assigned_to": "L'utilisateur assigné doit être membre du projet."})
        
        return data
