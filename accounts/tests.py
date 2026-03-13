import pytest
from rest_framework import status
from accounts.models import User, Profile

@pytest.fixture
def professor_user(db):
    return User.objects.create_user(
        username='prof',
        email='prof@test.com',
        password='testpass123',
        first_name='Prof',
        last_name='User',
        role='professeur'
    )

@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        username='student',
        email='student@test.com',
        password='testpass123',
        first_name='Student',
        last_name='User',
        role='etudiant'
    )

# ============ User Model Tests ============
@pytest.mark.django_db
def test_user_creation(professor_user):
    """Test la création d'un utilisateur"""
    assert professor_user.email == 'prof@test.com'
    assert professor_user.role == 'professeur'
    assert professor_user.first_name == 'Prof'

@pytest.mark.django_db
def test_user_string_representation(professor_user):
    """Test la représentation en string de l'utilisateur"""
    assert str(professor_user) == 'prof'

@pytest.mark.django_db
def test_user_authentication(professor_user):
    """Test l'authentification d'un utilisateur"""
    assert professor_user.check_password('testpass123')

@pytest.mark.django_db
def test_user_is_professor(professor_user, student_user):
    """Test la propriété is_professor"""
    assert professor_user.is_professor is True
    assert student_user.is_professor is False

@pytest.mark.django_db
def test_user_display_name(professor_user):
    """Test le display_name de l'utilisateur"""
    assert professor_user.display_name == 'Prof User'

@pytest.mark.django_db
def test_user_display_role(professor_user, student_user):
    """Test le display_role de l'utilisateur"""
    assert professor_user.display_role == 'Professeur'
    assert student_user.display_role == 'Etudiant'

@pytest.mark.django_db
def test_user_has_profile(professor_user):
    """Test que chaque utilisateur a un profil"""
    assert hasattr(professor_user, 'profile')
    assert professor_user.profile is not None

@pytest.mark.django_db
def test_profile_creation_on_user_creation(db):
    """Test qu'un profil est créé avec l'utilisateur"""
    user = User.objects.create_user(
        username='newuser',
        email='new@test.com',
        password='testpass123'
    )
    assert Profile.objects.filter(user=user).exists()

@pytest.mark.django_db
def test_profile_avatar_field(professor_user):
    """Test le champ avatar du profil"""
    assert professor_user.profile.avatar.name == '' or professor_user.profile.avatar is not None

@pytest.mark.django_db
def test_profile_bio_field(professor_user):
    """Test le champ bio du profil"""
    professor_user.profile.bio = 'Professor Bio'
    professor_user.profile.save()
    professor_user.profile.refresh_from_db()
    assert professor_user.profile.bio == 'Professor Bio'

@pytest.mark.django_db
def test_profile_string_representation(professor_user):
    """Test la représentation en string du profil"""
    expected = f"Profile for {professor_user.username}"
    assert str(professor_user.profile) == expected
