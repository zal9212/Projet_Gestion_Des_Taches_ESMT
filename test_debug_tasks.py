import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tasks.models import Task
from django.utils import timezone
from config import settings

print('=== CONFIG EMAIL ===')
print('User:', settings.EMAIL_HOST_USER)
print('Password set:', bool(settings.EMAIL_HOST_PASSWORD))
print('Backend:', settings.EMAIL_BACKEND)

print('\n=== TACHES RECENTES ===')
now = timezone.now()
tasks = Task.objects.order_by('-id')[:5]
for t in tasks:
    if t.deadline:
        time_left = t.deadline - now
        print(f'Tâche: "{t.title}"')
        print(f'   Deadline: {t.deadline}')
        print(f'   Email assigné: {t.assigned_to.email if t.assigned_to else "AUCUN"}')
        print(f'   Heures restantes: {time_left.total_seconds() / 3600.0:.2f}')
        print(f'   Flags (1w / 48h / 24h): {t.notified_1_week} / {t.notified_48_hours} / {t.notified_24_hours}')
        print('-'*30)
