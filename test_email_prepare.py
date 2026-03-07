import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tasks.models import Task
from django.contrib.auth import get_user_model
User = get_user_model()
from projects.models import Project

# Trouver un utilisateur avec un email
user = User.objects.exclude(email='').first()
if not user:
    # Créer un utilisateur temporaire pour le test si aucun n'existe
    user = User.objects.create(username='test_email', email='septcontac@gmail.com')

# Trouver un projet
project = Project.objects.first()
if not project:
    project = Project.objects.create(name='Projet Test Email', description='Pour tester les mails')

now = timezone.now()

# 1. Tâche qui expire dans 6 jours (devrait déclencher l'alerte "1 semaine")
task_1_week, _ = Task.objects.get_or_create(title='Tâche Test 1 Semaine', project=project)
task_1_week.assigned_to = user
task_1_week.status = 'todo'
task_1_week.deadline = now + timedelta(days=6)
task_1_week.notified_1_week = False
task_1_week.notified_48_hours = False
task_1_week.notified_24_hours = False
task_1_week.save()

# 2. Tâche qui expire dans 40 heures (devrait déclencher l'alerte "48h")
task_48h, _ = Task.objects.get_or_create(title='Tâche Test 48 heures', project=project)
task_48h.assigned_to = user
task_48h.status = 'todo'
task_48h.deadline = now + timedelta(hours=40)
task_48h.notified_1_week = False  
task_48h.notified_48_hours = False
task_48h.notified_24_hours = False
task_48h.save()

# 3. Tâche qui expire dans 10 heures (devrait déclencher l'alerte "24h")
task_24h, _ = Task.objects.get_or_create(title='Tâche Test 24 heures', project=project)
task_24h.assigned_to = user
task_24h.status = 'todo'
task_24h.deadline = now + timedelta(hours=10)
task_24h.notified_1_week = False
task_24h.notified_48_hours = False
task_24h.notified_24_hours = False
task_24h.save()

print(f"✅ 3 Tâches de test ont été créées/mises à jour.")
print(f"   - '{task_1_week.title}' : expire dans 6 jours.")
print(f"   - '{task_48h.title}' : expire dans 40 heures.")
print(f"   - '{task_24h.title}' : expire dans 10 heures.")
print(f"Assigné à : {user.email}")
print(f"\nVous pouvez maintenant lancer la commande : python manage.py notify_due_tasks")
