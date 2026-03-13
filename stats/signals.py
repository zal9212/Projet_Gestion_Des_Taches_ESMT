from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings


@receiver(post_save, sender='stats.Notification')
def send_notification_email(sender, instance, created, **kwargs):
    """
    Envoie un email à l'utilisateur à chaque fois qu'une notification est créée.
    """
    if not created:
        return  # Ne pas renvoyer un mail si la notif est simplement mise à jour (ex: marquée comme lue)

    user = instance.user
    recipient_email = getattr(user, 'email', None)
    if not recipient_email:
        return  # Pas d'email, on ignore silencieusement

    # Icônes/titres selon le type de notification
    type_labels = {
        'deadline': '⏰ Rappel de date limite',
        'assignement': '📋 Nouvelle tâche / Mise à jour',
        'prime': '🏆 Attribution de prime',
        'message': '💬 Nouveau message',
    }
    subject = type_labels.get(instance.type, '🔔 Notification ESMT Tasks')

    body = f"""Bonjour {user.get_full_name() or user.username},

Vous avez reçu une nouvelle notification sur ESMT Tasks :

  {instance.message}

Connectez-vous pour consulter tous vos détails :
  http://localhost:8000/

---
Ceci est un message automatique. Ne pas répondre à cet email.
ESMT Tasks — Plateforme de gestion de projets et de tâches.
"""

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=True,  # Ne pas crasher l'application si l'email échoue
        )
    except Exception:
        pass  # L'email est secondaire, on ne bloque jamais l'application
