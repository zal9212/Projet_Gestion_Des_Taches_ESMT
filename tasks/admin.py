from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'status', 'completed_at')
    list_filter = ('status', 'completed_at')
    search_fields = ('project__name',)
    list_editable = ('status',)
    readonly_fields = ('completed_at',)