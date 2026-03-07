from django.urls import path
from . import web_views

urlpatterns = [
    path('tasks/', web_views.TaskListView.as_view(), name='task_list'),
    path('project/<int:project_id>/task/add/', web_views.TaskCreateView.as_view(), name='task_add'),
    path('task/<int:pk>/edit/', web_views.TaskUpdateView.as_view(), name='task_edit'),
    path('task/<int:pk>/status/', web_views.TaskStatusUpdateView.as_view(), name='task_status_update'),
    path('task/<int:pk>/validate/', web_views.TaskValidateView.as_view(), name='task_validate'),
    path('task/<int:pk>/delete/', web_views.TaskDeleteView.as_view(), name='task_delete'),
]
