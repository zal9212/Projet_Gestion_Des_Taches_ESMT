import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data.get('message', '')
            user = self.scope["user"]

            if user.is_authenticated:
                if 'file_id' in data:
                    # File was uploaded via HTTP, now we signal it to the group
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': message,
                            'username': user.username,
                            'timestamp': timezone.now().strftime('%H:%M'),
                            'file': data.get('file_url'),
                            'file_name': data.get('file_name'),
                            'file_type': data.get('file_type')
                        }
                    )
                elif message:
                    # Standard text message
                    if self.room_name != 'global':
                        await self.save_message(user, self.room_name, message)

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': message,
                            'username': user.username,
                            'timestamp': timezone.now().strftime('%H:%M')
                        }
                    )
        except Exception as e:
            print(f"Error in receive: {e}")

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, user, conversation_id, content):
        from .models import Message, Conversation
        try:
            conv = Conversation.objects.get(id=conversation_id)
            return Message.objects.create(
                conversation=conv,
                sender=user,
                content=content
            )
        except Exception as e:
            print(f"Error saving msg: {e}")
            return None
