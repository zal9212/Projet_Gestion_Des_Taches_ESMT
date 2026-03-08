from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StatsViewSet, PrimeViewSet, NotificationViewSet
from .views_assistant import AssistantChatAPIView

router = DefaultRouter()
router.register(r'stats', StatsViewSet, basename='stats')
router.register(r'primes', PrimeViewSet, basename='prime')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Chatbot IA : /api/assistant/
    path('assistant/', AssistantChatAPIView.as_view(), name='assistant_chat'),
    path('', include(router.urls)),
]

