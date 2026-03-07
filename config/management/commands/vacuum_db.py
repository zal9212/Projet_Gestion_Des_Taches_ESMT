"""
Commande : python manage.py vacuum_db
Compacte la base SQLite (VACUUM) pour libérer de l'espace et éviter l'erreur "database or disk is full".
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Lance VACUUM sur la base SQLite pour libérer de l'espace disque."

    def handle(self, *args, **options):
        if connection.vendor != 'sqlite':
            self.stdout.write(self.style.WARNING("VACUUM n'est utile que pour SQLite. Base actuelle : %s" % connection.vendor))
            return
        with connection.cursor() as cursor:
            cursor.execute("VACUUM")
        self.stdout.write(self.style.SUCCESS("VACUUM exécuté avec succès. Espace disque libéré."))
