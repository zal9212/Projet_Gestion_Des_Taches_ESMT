import logging
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore, register_events
from django.core.management import call_command

logger = logging.getLogger(__name__)

def run_task_notifications():
    try:
        call_command('notify_due_tasks')
    except Exception as e:
        logger.error(f"Erreur d'envoi automatique de mails des taches: {e}")

def start():
    scheduler = BackgroundScheduler()
    # Utilisation de la BDD pour mémoriser les jobs (pour ne pas les perdre si on redémarre)
    scheduler.add_jobstore(DjangoJobStore(), "default")
    
    # On supprime les anciens jobs du même nom pour éviter les doublons au redémarrage
    scheduler.add_job(
        run_task_notifications,
        'interval',
        # Pour le jour de la soutenance, vous pouvez mettre `minutes=1` pour que l'action soit rapide (ici on met 10 secondes ou 1 minute pour que vous testiez maintenant facilement)
        minutes=1,
        name='run_task_notifications',
        jobstore='default',
        replace_existing=True,
    )
    register_events(scheduler)
    scheduler.start()
    print("🤖[Robot des Tâches] Scheduler APScheduler démarré avec succès ! Je vérifie les e-mails toutes les minutes.")
