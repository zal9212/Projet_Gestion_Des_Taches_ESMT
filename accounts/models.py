from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    ROLE_CHOICES = [('etudiant','Etudiant'),('professeur','Professeur')]
    role= models.CharField(max_length=20, choices=ROLE_CHOICES, default='etudiant')

    @property
    def is_professor(self): return self.role == 'professeur'

    @property
    def display_name(self):
        full_name = self.get_full_name()
        return full_name if full_name.strip() else self.username

    @property
    def display_role(self):
        return dict(self.ROLE_CHOICES).get(self.role, "Utilisateur")

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # En cas d'importations via admin/shell, le profil peut manquer
    profile, created = Profile.objects.get_or_create(user=instance)
    if not created:
        profile.save()


class Message(models.Model):
    """
    Message privé simple entre deux utilisateurs.
    """
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"De {self.sender} à {self.recipient} : {self.subject or self.body[:30]}"
