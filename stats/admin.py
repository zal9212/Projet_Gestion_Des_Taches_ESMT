from django.contrib import admin
from .models import Stats, Prime, Notification

@admin.register(Stats)
class StatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'period_type', 'year', 'quarter', 'total_tasks',
                   'completed_tasks', 'completion_rate', 'generated_at')
    list_filter = ('period_type', 'year', 'quarter', 'generated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('generated_at',)
    ordering = ('-year', '-quarter')

@admin.register(Prime)
class PrimeAdmin(admin.ModelAdmin):
    list_display = ('user', 'year', 'amount', 'completion_rate', 'attributed_at')
    list_filter = ('year', 'attributed_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('attributed_at',)
    ordering = ('-year',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'message', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('user__username', 'user__email', 'message')
    list_editable = ('is_read',)
    ordering = ('-created_at',)