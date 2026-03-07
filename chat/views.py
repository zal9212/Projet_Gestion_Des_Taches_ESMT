from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message, Contact
from .serializers import ConversationSerializer, MessageSerializer, ContactSerializer, UserMinimalSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.conversations.all()

    @action(detail=False, methods=['post'])
    def start_private(self, request):
        from django.shortcuts import get_object_or_404
        recipient_id = request.data.get('recipient_id')
        if not recipient_id:
            return Response({'error': 'recipient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        recipient = get_object_or_404(User, id=recipient_id)
        
        # Check if conversation already exists between these two specifically
        # We look for a conversation that has exactly these two participants
        convs = Conversation.objects.filter(is_group=False, participants=request.user).filter(participants=recipient)
        
        conv = None
        for c in convs:
            if c.participants.count() == 2:
                conv = c
                break
        
        if not conv:
            conv = Conversation.objects.create(is_group=False)
            conv.participants.add(request.user, recipient)
            
        return Response(ConversationSerializer(conv).data)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        msgs = conversation.messages.all()
        return Response(MessageSerializer(msgs, many=True).data)

    @action(detail=True, methods=['post'])
    def send_file(self, request, pk=None):
        conversation = self.get_object()
        file = request.FILES.get('file')
        content = request.data.get('content', '')
        
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        msg = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            file=file,
            file_name=file.name,
            file_type='image' if file.content_type.startswith('image/') else 'document'
        )
        
        # We might want to notify via WebSocket here, but typically the consumer handles it
        # For files, we use HTTP upload then signal through WS
        return Response(MessageSerializer(msg).data)

class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.contacts_list.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def search_users(self, request):
        query = request.query_params.get('q', '')
        users = User.objects.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        ).exclude(id=request.user.id)[:20]
        return Response(UserMinimalSerializer(users, many=True).data)
