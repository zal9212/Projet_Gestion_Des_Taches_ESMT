import pytest
from accounts.models import User
from chat.models import Conversation, Message, Contact

@pytest.fixture
def user1(db):
    return User.objects.create_user(
        username='user1',
        email='user1@test.com',
        password='testpass123'
    )

@pytest.fixture
def user2(db):
    return User.objects.create_user(
        username='user2',
        email='user2@test.com',
        password='testpass123'
    )

@pytest.fixture
def user3(db):
    return User.objects.create_user(
        username='user3',
        email='user3@test.com',
        password='testpass123'
    )

@pytest.fixture
def private_conversation(db, user1, user2):
    conv = Conversation.objects.create(is_group=False)
    conv.participants.add(user1, user2)
    return conv

@pytest.fixture
def group_conversation(db, user1, user2, user3):
    conv = Conversation.objects.create(name='Group Chat', is_group=True)
    conv.participants.add(user1, user2, user3)
    return conv

# ============ Conversation Model Tests ============
@pytest.mark.django_db
def test_private_conversation_creation(user1, user2):
    """Test la création d'une conversation privée"""
    conv = Conversation.objects.create(is_group=False)
    conv.participants.add(user1, user2)
    assert conv.is_group is False
    assert conv.participants.count() == 2

@pytest.mark.django_db
def test_group_conversation_creation(user1, user2, user3):
    """Test la création d'une conversation de groupe"""
    conv = Conversation.objects.create(name='Group', is_group=True)
    conv.participants.add(user1, user2, user3)
    assert conv.is_group is True
    assert conv.name == 'Group'
    assert conv.participants.count() == 3

@pytest.mark.django_db
def test_conversation_string_representation(group_conversation):
    """Test la représentation en string d'une conversation"""
    assert str(group_conversation) == 'Group Chat'

@pytest.mark.django_db
def test_private_conversation_string_representation(private_conversation):
    """Test la représentation d'une conversation sans nom"""
    assert str(private_conversation) == f"Conversation {private_conversation.id}"

@pytest.mark.django_db
def test_conversation_created_at(private_conversation):
    """Test le timestamp created_at"""
    assert private_conversation.created_at is not None

# ============ Message Model Tests ============
@pytest.mark.django_db
def test_message_creation(private_conversation, user1):
    """Test la création d'un message"""
    msg = Message.objects.create(
        conversation=private_conversation,
        sender=user1,
        content='Hello'
    )
    assert msg.sender == user1
    assert msg.content == 'Hello'

@pytest.mark.django_db
def test_message_with_file(private_conversation, user1):
    """Test la création d'un message avec fichier"""
    msg = Message.objects.create(
        conversation=private_conversation,
        sender=user1,
        content='Check this file',
        file_name='test.pdf',
        file_type='pdf'
    )
    assert msg.file_name == 'test.pdf'
    assert msg.file_type == 'pdf'

@pytest.mark.django_db
def test_message_ordering(private_conversation, user1, user2):
    """Test l'ordre des messages par timestamp"""
    msg1 = Message.objects.create(
        conversation=private_conversation,
        sender=user1,
        content='First'
    )
    msg2 = Message.objects.create(
        conversation=private_conversation,
        sender=user2,
        content='Second'
    )
    messages = Message.objects.all()
    assert messages[0].id == msg1.id

@pytest.mark.django_db
def test_message_string_representation(private_conversation, user1):
    """Test la représentation en string d'un message"""
    msg = Message.objects.create(
        conversation=private_conversation,
        sender=user1,
        content='Hello World Message Truncated'
    )
    assert 'Hello World' in str(msg)

@pytest.mark.django_db
def test_message_timestamp(private_conversation, user1):
    """Test le timestamp du message"""
    msg = Message.objects.create(
        conversation=private_conversation,
        sender=user1,
        content='Test'
    )
    assert msg.timestamp is not None

@pytest.mark.django_db
def test_message_content_optional(private_conversation, user1):
    """Test que le contenu peut être vide"""
    msg = Message.objects.create(
        conversation=private_conversation,
        sender=user1
    )
    assert msg.content == ''

# ============ Contact Model Tests ============
@pytest.mark.django_db
def test_contact_creation(user1, user2):
    """Test la création d'un contact"""
    contact = Contact.objects.create(user=user1, contact=user2)
    assert contact.user == user1
    assert contact.contact == user2

@pytest.mark.django_db
def test_contact_unique_constraint(user1, user2):
    """Test la contrainte d'unicité des contacts"""
    Contact.objects.create(user=user1, contact=user2)
    with pytest.raises(Exception):  # IntegrityError
        Contact.objects.create(user=user1, contact=user2)

@pytest.mark.django_db
def test_contact_string_representation(user1, user2):
    """Test la représentation en string d'un contact"""
    contact = Contact.objects.create(user=user1, contact=user2)
    expected = f"{user1.username} -> {user2.username}"
    assert str(contact) == expected

@pytest.mark.django_db
def test_contact_added_at(user1, user2):
    """Test le timestamp added_at"""
    contact = Contact.objects.create(user=user1, contact=user2)
    assert contact.added_at is not None

@pytest.mark.django_db
def test_multiple_contacts(user1, user2, user3):
    """Test plusieurs contacts pour un utilisateur"""
    Contact.objects.create(user=user1, contact=user2)
    Contact.objects.create(user=user1, contact=user3)
    assert user1.contacts_list.count() == 2
