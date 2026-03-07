from django.urls import path
from . import web_views

urlpatterns = [
    path('', web_views.LandingView.as_view(), name='landing'),
    path('dashboard/', web_views.DashboardView.as_view(), name='dashboard'),
    path('projects/', web_views.ProjectListView.as_view(), name='project_list'),
    path('project/add/', web_views.ProjectCreateView.as_view(), name='project_add'),
    path('project/<int:pk>/', web_views.ProjectDetailView.as_view(), name='project_detail'),
    path('project/<int:pk>/edit/', web_views.ProjectUpdateView.as_view(), name='project_edit'),
    path('project/<int:pk>/delete/', web_views.ProjectDeleteView.as_view(), name='project_delete'),
    
    # Membres
    path('project/<int:pk>/members/add/', web_views.ProjectMemberCreateView.as_view(), name='member_add'),
    path('project/invite/', web_views.ProjectInviteView.as_view(), name='project_invite'),
    path('member/<int:pk>/delete/', web_views.ProjectMemberDeleteView.as_view(), name='member_delete'),
]
