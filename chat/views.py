from django.shortcuts import render, get_object_or_404, redirect
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

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Can only see messages in conversations you belong to
        return Message.objects.filter(conversation__participants=self.request.user)

    @action(detail=False, methods=['post'])
    def forward(self, request):
        message_ids = request.data.get('message_ids', [])
        conversation_id = request.data.get('conversation_id')
        
        if not message_ids or not conversation_id:
            return Response({'error': 'message_ids and conversation_id are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        conversation = get_object_or_404(Conversation, id=conversation_id, participants=request.user)
        
        messages = Message.objects.filter(id__in=message_ids, conversation__participants=request.user)
        forwarded_msgs = []
        
        for msg in messages:
            new_msg = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=f"--- Transféré ---\n{msg.content}" if msg.content else "--- Transféré ---",
                file=msg.file,
                file_name=msg.file_name,
                file_type=msg.file_type
            )
            forwarded_msgs.append(new_msg)
        
        return Response(MessageSerializer(forwarded_msgs, many=True).data)

    @action(detail=False, methods=['post'])
    def batch_delete(self, request):
        message_ids = request.data.get('message_ids', [])
        if not message_ids:
            return Response({'error': 'message_ids is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Only delete messages you sent OR messages in a conversation you belong to (if we allow that)
        # Typically you can only delete YOUR messages.
        msgs = Message.objects.filter(id__in=message_ids, sender=request.user)
        deleted_count = msgs.count()
        msgs.delete()
        
        return Response({'deleted_count': deleted_count}, status=status.HTTP_200_OK)

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
