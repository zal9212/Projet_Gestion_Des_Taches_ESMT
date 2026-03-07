from rest_framework import serializers
from .models import Project, ProjectMember
from accounts.models import User
from tasks.serializers import TaskSerializer

class ProjectMemberSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    full_name = serializers.ReadOnlyField(source='user.get_full_name')
    role = serializers.ReadOnlyField(source='user.role')

    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'user', 'username', 'full_name', 'role', 'joined_at']
        read_only_fields = ['joined_at']

class ProjectSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    members_count = serializers.SerializerMethodField()
    project_tasks = TaskSerializer(many=True, read_only=True)
    members = ProjectMemberSerializer(source='project_members', many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'owner_username', 
                  'created_at', 'updated_at', 'members_count', 'project_tasks', 'members']
        read_only_fields = ['created_at', 'updated_at', 'owner']

    def get_members_count(self, obj):
        return obj.project_members.count()

    def create(self, validated_data):
        # Associe automatiquement l'utilisateur connecté comme owner
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)