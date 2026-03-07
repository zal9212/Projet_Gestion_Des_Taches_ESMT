from django.db import models
from django.conf import settings
from django.utils import timezone

from projects.models import Project


class Task(models.Model):
    project = models.ForeignKey(Project, related_name='project_tasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=200, default='Nouvelle Tâche')
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='todo')
    deadline = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='assigned_tasks', on_delete=models.SET_NULL, null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    validated_at = models.DateTimeField(null=True, blank=True, help_text="Date de validation par le propriétaire du projet.")
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='validated_tasks', on_delete=models.SET_NULL, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.status == 'done' and not self.completed_at:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)
