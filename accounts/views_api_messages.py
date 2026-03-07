from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q

from .models import Message, User
from .serializers_message import MessageSerializer, UserMinimalSerializer
from stats.models import Notification


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).select_related('sender', 'recipient').order_by('-created_at')

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        Notification.objects.create(
            user=msg.recipient,
            type='message',
            message=f"Nouveau message de {self.request.user.display_name} : {msg.subject or msg.body[:50]}",
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.recipient == request.user and not instance.is_read:
            instance.is_read = True
            instance.save(update_fields=['is_read'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='inbox')
    def inbox(self, request):
        """Messages reçus."""
        qs = self.get_queryset().filter(recipient=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='sent')
    def sent(self, request):
        """Messages envoyés."""
        qs = self.get_queryset().filter(sender=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='users')
    def users(self, request):
        """Liste des utilisateurs pour le dropdown destinataire (exclut l'utilisateur courant)."""
        qs = User.objects.exclude(id=request.user.id).order_by('username')
        serializer = UserMinimalSerializer(qs, many=True)
        return Response(serializer.data)
