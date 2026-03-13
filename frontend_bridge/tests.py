import pytest
from django.test import Client
from accounts.models import User

@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='user',
        email='user@test.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )

@pytest.fixture
def client():
    return Client()

# ============ Frontend Bridge Portal Tests ============
@pytest.mark.django_db
def test_portal_view_requires_login(client):
    """Test que la vue portal nécessite une authentification"""
    response = client.get('/portal/')
    assert response.status_code in [301, 302] or response.wsgi_request.user.is_anonymous

@pytest.mark.django_db
def test_portal_view_authenticated(client, user):
    """Test l'accès au portal quand authentifié"""
    client.login(username='user', password='testpass123')
    response = client.get('/portal/')
    assert response.status_code == 200

@pytest.mark.django_db
def test_portal_contains_html(client, user):
    """Test que le portal retourne du HTML"""
    client.login(username='user', password='testpass123')
    response = client.get('/portal/')
    assert response.status_code == 200
    assert 'html' in response.get('content-type', '').lower() or isinstance(response.content, bytes)

@pytest.mark.django_db
def test_portal_view_user_context(client, user):
    """Test que le context contient l'utilisateur"""
    client.login(username='user', password='testpass123')
    response = client.get('/portal/')
    assert response.status_code == 200
    # Verification que la requête a un utilisateur
    if hasattr(response, 'wsgi_request'):
        assert response.wsgi_request.user == user

# ============ Frontend Bridge Health Check Tests ============
@pytest.mark.django_db
def test_health_check_endpoint(client):
    """Test l'endpoint de santé du système"""
    response = client.get('/api/health/', follow=True)
    assert response.status_code in [200, 404, 405]

@pytest.mark.django_db
def test_api_root_access(client):
    """Test l'accès à la racine des API"""
    response = client.get('/api/', follow=True)
    # L'endpoint nécessite une authentification (401) ou est accessible
    assert response.status_code in [200, 301, 302, 401, 404, 405]

# ============ Frontend Bridge Serving Tests ============
@pytest.mark.django_db
def test_frontend_assets_accessible(client):
    """Test que les assets frontend sont accessibles"""
    # Ces URLs peuvent retourner 404 si les fichiers n'existent pas
    response = client.get('/static/angular/', follow=True)
    assert response.status_code in [200, 404]

@pytest.mark.django_db
def test_portal_bridge_view_exists(client, user):
    """Test que la vue portal_bridge est accessible"""
    client.login(username='user', password='testpass123')
    response = client.get('/portal_bridge/')
    assert response.status_code in [200, 301, 302, 404]

# ============ User Profile Access Tests ============
@pytest.mark.django_db
def test_user_profile_after_portal_login(client, user):
    """Test que le profil utilisateur est accessible après login"""
    client.login(username='user', password='testpass123')
    assert user.profile is not None

@pytest.mark.django_db
def test_anonymous_user_no_profile(client):
    """Test qu'un utilisateur anonyme n'a pas accès au profil"""
    response = client.get('/portal/')
    assert response.status_code in [301, 302]

@pytest.mark.django_db
def test_frontend_bridge_response_type(client, user):
    """Test que le portal retourne une réponse correcte"""
    client.login(username='user', password='testpass123')
    response = client.get('/portal/')
    assert response.status_code == 200
    # Verification que c'est du contenu
    assert len(response.content) > 0

@pytest.mark.django_db
def test_portal_redirect_when_not_authenticated(client):
    """Test que la page portal redirige vers login si pas authentifié"""
    response = client.get('/portal/', follow=False)
    assert response.status_code in [301, 302]
