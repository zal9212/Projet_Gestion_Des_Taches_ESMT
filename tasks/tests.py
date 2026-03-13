import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User
from projects.models import Project
from tasks.models import Task
from stats.models import Notification

@pytest.fixture
def professor_user(db):
    return User.objects.create_user(
        username='prof',
        email='prof@test.com',
        password='pwd',
        first_name='Prof',
        last_name='User',
        role='professeur'
    )

@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        username='student',
        email='student@test.com',
        password='pwd',
        first_name='Student',
        last_name='User',
        role='etudiant'
    )

@pytest.fixture
def project(db, professor_user):
    return Project.objects.create(name='Test Proj', owner=professor_user)

# ============ Task Model Tests ============
@pytest.mark.django_db
def test_task_creation(project):
    """Test la création d'une tâche"""
    task = Task.objects.create(
        project=project,
        title='Test Task',
        description='Test Description',
        status='todo'
    )
    assert task.title == 'Test Task'
    assert task.status == 'todo'
    assert task.completed_at is None

@pytest.mark.django_db
def test_task_save_sets_completed_at(project):
    """Test que completed_at est défini quand status='done'"""
    task = Task.objects.create(
        project=project,
        title='Test Task',
        status='in_progress'
    )
    assert task.completed_at is None
    
    task.status = 'done'
    task.save()
    assert task.completed_at is not None

@pytest.mark.django_db
def test_task_assign_to_user(project, professor_user):
    """Test l'assignation d'une tâche à un utilisateur"""
    task = Task.objects.create(
        project=project,
        title='Test Task',
        assigned_to=professor_user
    )
    assert task.assigned_to == professor_user

@pytest.mark.django_db
def test_task_validation(project, professor_user):
    """Test la validation d'une tâche"""
    task = Task.objects.create(
        project=project,
        title='Test Task'
    )
    task.validated_by = professor_user
    task.validated_at = timezone.now()
    task.save()
    
    assert task.validated_by == professor_user
    assert task.validated_at is not None

@pytest.mark.django_db
def test_task_notification_flags(project):
    """Test les flags de notification"""
    task = Task.objects.create(
        project=project,
        title='Test Task'
    )
    assert task.notified_1_week is False
    assert task.notified_48_hours is False
    assert task.notified_24_hours is False

@pytest.mark.django_db
def test_task_default_title(project):
    """Test le titre par défaut"""
    task = Task.objects.create(project=project)
    assert task.title == 'Nouvelle Tâche'

@pytest.mark.django_db
def test_task_deadline_field(project):
    """Test le champ deadline"""
    deadline = timezone.now()
    task = Task.objects.create(
        project=project,
        title='Task',
        deadline=deadline
    )
    assert task.deadline == deadline

@pytest.mark.django_db
def test_task_description_optional(project):
    """Test que la description est optionnelle"""
    task = Task.objects.create(project=project, title='Task')
    assert task.description is None or task.description == ''

@pytest.mark.django_db
def test_task_relation_to_project(project):
    """Test la relation entre tâche et projet"""
    task = Task.objects.create(project=project, title='Task')
    assert task.project == project
    assert project.project_tasks.count() == 1

@pytest.mark.django_db
def test_multiple_tasks_in_project(project):
    """Test plusieurs tâches dans un projet"""
    Task.objects.create(project=project, title='Task 1')
    Task.objects.create(project=project, title='Task 2')
    assert project.project_tasks.count() == 2
