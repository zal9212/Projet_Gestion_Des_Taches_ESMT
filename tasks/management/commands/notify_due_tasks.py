from django.core.management.base import BaseCommand
from django.utils import timezone
from tasks.models import Task
from django.core.mail import send_mail
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Envoie des notifications par email pour les tâches (à 1 semaine, 48h et 24h).'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        
        # Tâches non terminées, avec une deadline
        tasks = Task.objects.filter(
            status__in=['todo', 'in_progress'],
            deadline__isnull=False,
            assigned_to__isnull=False
        )
        
        count = 0
        for task in tasks:
            time_left = task.deadline - now
            user = task.assigned_to
            
            if not user or not user.email:
                continue

            # Ne rien envoyer si la deadline est déjà passée de beaucoup (on peut laisser passer si c'est < 0 mais ici on teste les rappels avant)
            if time_left.total_seconds() < 0:
                continue

            days_left = time_left.days
            hours_left = time_left.total_seconds() / 3600.0

            should_notify = False
            threshold_msg = ""

            # Vérification 24h
            if hours_left <= 24 and not task.notified_24_hours:
                should_notify = True
                threshold_msg = "Moins de 24 heures"
                task.notified_24_hours = True
                # On coche aussi les autres pour ne pas les envoyer en retard
                task.notified_48_hours = True
                task.notified_1_week = True

            # Vérification 48h
            elif hours_left <= 48 and not task.notified_48_hours:
                should_notify = True
                threshold_msg = "Moins de 48 heures"
                task.notified_48_hours = True
                task.notified_1_week = True

            # Vérification 1 semaine (7 jours)
            elif days_left <= 7 and not task.notified_1_week:
                should_notify = True
                threshold_msg = "1 semaine"
                task.notified_1_week = True

            if should_notify:
                subject = f"Rappel ({threshold_msg}): La tâche '{task.title}' arrive bientôt à échéance"
                message = (
                    f"Bonjour {user.get_full_name() or user.username},\n\n"
                    f"Ceci est un rappel que votre tâche '{task.title}' dans le projet '{task.project.name}' "
                    f"doit être terminée pour le {task.deadline.strftime('%d/%m/%Y %H:%M')}.\n"
                    f"Temps restant : {threshold_msg}.\n\n"
                    f"N'oubliez pas de mettre à jour son statut sur la plateforme.\n\n"
                    f"Cordialement,\nL'équipe ESMT Tasks"
                )
                try:
                    send_mail(subject, message, None, [user.email])
                    count += 1
                    task.save()
                    self.stdout.write(self.style.SUCCESS(f"Email '{threshold_msg}' envoyé à {user.email} pour la tâche {task.id}."))
                except Exception as e:
                    logger.error(f"Erreur d'envoi d'email à {user.email}: {e}")
                    self.stdout.write(self.style.ERROR(f"Erreur d'envoi d'email à {user.email}: {e}"))
                    
        self.stdout.write(self.style.SUCCESS(f"Traitement terminé : Notifications envoyées pour {count} tâche(s)."))
