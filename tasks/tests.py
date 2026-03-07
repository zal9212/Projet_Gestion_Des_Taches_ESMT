import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User
from projects.models import Project, ProjectMember
from tasks.models import Task

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def professor_user(db):
    return User.objects.create_user(username='prof', password='pwd', role='professeur')

@pytest.fixture
def student_user(db):
    return User.objects.create_user(username='student', password='pwd', role='etudiant')

@pytest.fixture
def student_owner(db):
    return User.objects.create_user(username='student_owner', password='pwd', role='etudiant')

@pytest.fixture
def project(db, professor_user):
    return Project.objects.create(name='Test Proj', owner=professor_user)

@pytest.fixture
def student_project(db, student_owner):
    return Project.objects.create(name='Student Proj', owner=student_owner)

@pytest.mark.django_db
def test_non_owner_cannot_add_task(api_client, student_user, project):
    api_client.force_authenticate(user=student_user)
    url = '/api/tasks/'
    data = {'project': project.id, 'title': 'Task by non-owner'}
    
    response = api_client.post(url, data)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_student_owner_cannot_assign_professor(api_client, student_owner, professor_user, student_project):
    api_client.force_authenticate(user=student_owner)
    url = '/api/tasks/'
    data = {
        'project': student_project.id,
        'title': 'Task to Professor',
        'assigned_to': professor_user.id
    }
    
    response = api_client.post(url, data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Un étudiant ne peut pas assigner une tâche à un professeur" in str(response.data)

@pytest.mark.django_db
def test_professor_owner_can_assign_professor(api_client, professor_user, project):
    api_client.force_authenticate(user=professor_user)
    url = '/api/tasks/'
    data = {
        'project': project.id,
        'title': 'Valid Assignment',
        'assigned_to': professor_user.id
    }
    
    response = api_client.post(url, data)
    assert response.status_code == status.HTTP_201_CREATED
