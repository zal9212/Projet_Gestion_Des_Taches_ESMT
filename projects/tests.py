import pytest
from projects.models import Project, ProjectMember
from accounts.models import User

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
    return Project.objects.create(
        name='Test Project',
        description='Test Description',
        owner=professor_user
    )

# ============ Project Model Tests ============
@pytest.mark.django_db
def test_project_creation(professor_user):
    """Test la création d'un projet"""
    project = Project.objects.create(
        name='Test Project',
        description='Test Description',
        owner=professor_user
    )
    assert project.name == 'Test Project'
    assert project.owner == professor_user

@pytest.mark.django_db
def test_project_string_representation(project):
    """Test la représentation en string du projet"""
    assert str(project) == 'Test Project'

@pytest.mark.django_db
def test_project_ordering(professor_user):
    """Test que les projets sont ordonnés par date décroissante"""
    project1 = Project.objects.create(name='Project 1', owner=professor_user)
    project2 = Project.objects.create(name='Project 2', owner=professor_user)
    projects = Project.objects.all()
    assert projects[0].id == project2.id

@pytest.mark.django_db
def test_project_description_field(project):
    """Test le champ description"""
    assert project.description == 'Test Description'

@pytest.mark.django_db
def test_project_timestamps(project):
    """Test les timestamps created_at et updated_at"""
    assert project.created_at is not None
    assert project.updated_at is not None

# ============ ProjectMember Model Tests ============
@pytest.mark.django_db
def test_project_member_creation(project, student_user):
    """Test la création d'un membre du projet"""
    member = ProjectMember.objects.create(project=project, user=student_user)
    assert member.project == project
    assert member.user == student_user

@pytest.mark.django_db
def test_project_member_unique_constraint(project, student_user):
    """Test la contrainte d'unicité pour les membres"""
    ProjectMember.objects.create(project=project, user=student_user)
    with pytest.raises(Exception):  # IntegrityError
        ProjectMember.objects.create(project=project, user=student_user)

@pytest.mark.django_db
def test_project_member_string_representation(project, student_user):
    """Test la représentation en string du membre"""
    member = ProjectMember.objects.create(project=project, user=student_user)
    assert str(member) == student_user.username

@pytest.mark.django_db
def test_project_member_joined_at(project, student_user):
    """Test le timestamp joined_at"""
    member = ProjectMember.objects.create(project=project, user=student_user)
    assert member.joined_at is not None

@pytest.mark.django_db
def test_project_has_members(project, student_user):
    """Test la relation inverse: projet.project_members"""
    ProjectMember.objects.create(project=project, user=student_user)
    assert project.project_members.count() == 1

@pytest.mark.django_db
def test_user_has_project_members(professor_user, student_user):
    """Test la relation inverse: user.project_members"""
    project = Project.objects.create(name='Project', owner=professor_user)
    ProjectMember.objects.create(project=project, user=student_user)
    assert student_user.project_members.count() == 1
