from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message, Contact

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role')

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')
    
    class Meta:
        model = Message
        fields = ('id', 'conversation', 'sender', 'sender_username', 'content', 'file', 'file_name', 'file_type', 'timestamp')

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserMinimalSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'participants', 'created_at', 'is_group', 'name', 'last_message')

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

class ContactSerializer(serializers.ModelSerializer):
    contact_details = UserMinimalSerializer(source='contact', read_only=True)

    class Meta:
        model = Contact
        fields = ('id', 'user', 'contact', 'contact_details', 'added_at')
        read_only_fields = ('user',)
