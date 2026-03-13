from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    RegisterView,
    ProfileView,
    logout_view,
    MemberDirectoryView,
    DeleteAccountView,
)
from .views_api import MeView, RegisterAPIView, SessionTokenView

urlpatterns = [
    path('api/session-token/', SessionTokenView.as_view(), name='session-token'),
    path('login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('logout/', logout_view, name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account_final'),
    path('members/', MemberDirectoryView.as_view(), name='member_directory'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/register/', RegisterAPIView.as_view(), name='api-register'),
    path('password_change/', auth_views.PasswordChangeView.as_view(template_name='accounts/password_change.html', success_url='/accounts/profile/'), name='password_change'),
]
