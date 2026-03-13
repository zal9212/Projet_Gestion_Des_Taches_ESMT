from django.urls import path
from django.views.generic import RedirectView
from . import web_views

urlpatterns = [
    # Tâches — vues Django complètes
    path('project/<int:project_id>/task/add/', web_views.TaskCreateView.as_view(), name='task_add'),
    path('task/<int:pk>/edit/', web_views.TaskUpdateView.as_view(), name='task_edit'),
    path('task/<int:pk>/status/', web_views.TaskStatusUpdateView.as_view(), name='task_status_update'),
    path('task/<int:pk>/validate/', web_views.TaskValidateView.as_view(), name='task_validate'),
    path('task/<int:pk>/delete/', web_views.TaskDeleteView.as_view(), name='task_delete'),
    # Rediriger l'ancienne vue liste des tâches vers Angular (la liste est dans le portail)
    path('tasks/', RedirectView.as_view(url='/portal/dashboard/'), name='tasks'),
    # Rediriger l'ancien calendrier Django vers le portail Angular
    path('calendar/', RedirectView.as_view(url='/portal/calendar/'), name='calendar'),
]
