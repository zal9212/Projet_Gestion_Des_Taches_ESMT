import pytest
from datetime import datetime
from stats.models import Stats, Prime, Notification
from accounts.models import User

@pytest.fixture
def professor_user(db):
    return User.objects.create_user(
        username='prof',
        email='prof@test.com',
        password='testpass123',
        role='professeur'
    )

@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        username='student',
        email='student@test.com',
        password='testpass123',
        role='etudiant'
    )

# ============ Stats Model Tests ============
@pytest.mark.django_db
def test_stats_creation(professor_user):
    """Test la création d'une statistique"""
    stat = Stats.objects.create(
        user=professor_user,
        period_type='trimestriel',
        year=2026,
        quarter=1,
        total_tasks=10,
        completed_tasks=8,
        completion_rate=80.00
    )
    assert stat.user == professor_user
    assert stat.completion_rate == 80.00

@pytest.mark.django_db
def test_stats_annual_type(professor_user):
    """Test les statistiques annuelles"""
    stat = Stats.objects.create(
        user=professor_user,
        period_type='annuel',
        year=2026,
        total_tasks=40,
        completed_tasks=36,
        completion_rate=90.00
    )
    assert stat.period_type == 'annuel'

@pytest.mark.django_db
def test_stats_unique_constraint(professor_user):
    """Test la contrainte d'unicité des statistiques"""
    Stats.objects.create(
        user=professor_user,
        period_type='trimestriel',
        year=2026,
        quarter=1
    )
    with pytest.raises(Exception):  # IntegrityError
        Stats.objects.create(
            user=professor_user,
            period_type='trimestriel',
            year=2026,
            quarter=1
        )

@pytest.mark.django_db
def test_stats_quarter_nullable(professor_user):
    """Test que quarter peut être null pour annuel"""
    stat = Stats.objects.create(
        user=professor_user,
        period_type='annuel',
        year=2026,
        quarter=None
    )
    assert stat.quarter is None

# ============ Prime Model Tests ============
@pytest.mark.django_db
def test_prime_creation(professor_user):
    """Test la création d'une prime"""
    prime = Prime.objects.create(
        user=professor_user,
        amount=30000.00,
        year=2026,
        completion_rate=90.00
    )
    assert prime.user == professor_user
    assert prime.amount == 30000.00

@pytest.mark.django_db
def test_prime_maximum_amount(professor_user):
    """Test la prime maximale (100k)"""
    prime = Prime.objects.create(
        user=professor_user,
        amount=100000.00,
        year=2026,
        completion_rate=100.00
    )
    assert prime.amount == 100000.00

@pytest.mark.django_db
def test_prime_unique_constraint(professor_user):
    """Test la contrainte d'unicité des primes"""
    Prime.objects.create(
        user=professor_user,
        amount=30000.00,
        year=2026
    )
    with pytest.raises(Exception):  # IntegrityError
        Prime.objects.create(
            user=professor_user,
            year=2026
        )

@pytest.mark.django_db
def test_prime_attributed_at(professor_user):
    """Test le timestamp attributed_at"""
    prime = Prime.objects.create(
        user=professor_user,
        amount=30000.00,
        year=2026
    )
    assert prime.attributed_at is not None

# ============ Notification Model Tests ============
@pytest.mark.django_db
def test_notification_creation(professor_user):
    """Test la création d'une notification"""
    notif = Notification.objects.create(
        user=professor_user,
        message='Test notification',
        type='deadline'
    )
    assert notif.user == professor_user
    assert notif.is_read is False

@pytest.mark.django_db
def test_notification_types(professor_user):
    """Test les différents types de notifications"""
    types = ['deadline', 'assignement', 'prime', 'message']
    for notif_type in types:
        notif = Notification.objects.create(
            user=professor_user,
            message=f'{notif_type} notification',
            type=notif_type
        )
        assert notif.type == notif_type

@pytest.mark.django_db
def test_notification_mark_as_read(professor_user):
    """Test le marquage d'une notification comme lue"""
    notif = Notification.objects.create(
        user=professor_user,
        message='Test notification'
    )
    assert notif.is_read is False
    notif.is_read = True
    notif.save()
    assert notif.is_read is True

@pytest.mark.django_db
def test_notification_created_at(professor_user):
    """Test le timestamp created_at"""
    notif = Notification.objects.create(
        user=professor_user,
        message='Test'
    )
    assert notif.created_at is not None

@pytest.mark.django_db
def test_multiple_notifications_per_user(professor_user):
    """Test plusieurs notifications pour un utilisateur"""
    Notification.objects.create(user=professor_user, message='Notif 1')
    Notification.objects.create(user=professor_user, message='Notif 2')
    assert professor_user.notifications.count() == 2

@pytest.mark.django_db
def test_unread_notifications_filter(professor_user, student_user):
    """Test le filtrage des notifications non lues"""
    Notification.objects.create(user=professor_user, message='Unread', is_read=False)
    Notification.objects.create(user=professor_user, message='Read', is_read=True)
    unread = Notification.objects.filter(user=professor_user, is_read=False)
    assert unread.count() == 1
