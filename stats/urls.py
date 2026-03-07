from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StatsViewSet, PrimeViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'stats', StatsViewSet, basename='stats')
router.register(r'primes', PrimeViewSet, basename='prime')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
