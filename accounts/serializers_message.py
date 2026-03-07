from rest_framework import serializers
from .models import Message, User


class UserMinimalSerializer(serializers.ModelSerializer):
    """Pour le dropdown destinataire et l'affichage des messages."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_full_name = serializers.SerializerMethodField()
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    recipient_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'recipient', 'subject', 'body',
            'is_read', 'created_at',
            'sender_username', 'sender_full_name',
            'recipient_username', 'recipient_full_name',
        ]
        read_only_fields = ['sender', 'created_at']

    def get_sender_full_name(self, obj):
        return obj.sender.display_name

    def get_recipient_full_name(self, obj):
        return obj.recipient.display_name
