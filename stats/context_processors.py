from .models import Notification


def notifications_processor(request):
    """
    Expose les notifications non lues dans tous les templates.
    """
    if not request.user.is_authenticated:
        return {}

    qs = Notification.objects.filter(user=request.user, is_read=False).order_by("-created_at")
    return {
        "unread_notifications": qs[:5],
        "unread_notifications_count": qs.count(),
    }

