from django.apps import AppConfig


class TasksConfig(AppConfig):
    name = 'tasks'

    def ready(self):
        import os
        # Lancer le scheduler uniquement avec le processus principal (pour éviter les doublons avec le reloader `manage.py runserver`)
        if os.environ.get('RUN_MAIN', None) == 'true':
            from . import scheduler
            scheduler.start()

