from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, ContactViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
]
