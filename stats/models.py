from django.db import models

from accounts.models import User


class Stats(models.Model):
    user = models.ForeignKey(User,related_name='stats',on_delete=models.CASCADE)
    PERIOD_CHOICES = [('trimestriel','Trimestriel'),('annuel','Annuel')]
    period_type = models.CharField(max_length=20,choices=PERIOD_CHOICES,default='trimestriel')
    year = models.IntegerField()
    quarter = models.IntegerField(null=True,blank=True)
    total_tasks = models.IntegerField(null=True,blank=True)
    completed_tasks = models.IntegerField(null=True,blank=True)
    completion_rate =models.DecimalField(max_digits=5,decimal_places=2,null=True,blank=True)
    generated_at = models.DateTimeField(null=True,blank=True)

    class Meta: constraints = [
        models.UniqueConstraint(fields=['user', 'period_type', 'year', 'quarter'], name='unique_user_period')]



class Prime(models.Model):
    user = models.ForeignKey(User,related_name='primes',on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=5,decimal_places=2,null=True,blank=True)
    year = models.IntegerField()
    completion_rate = models.DecimalField(max_digits=5,decimal_places=2,null=True,blank=True)
    attributed_at = models.DateTimeField(auto_now_add=True)

    class Meta: constraints = [
        models.UniqueConstraint(fields=['user', 'year'], name='unique_user')
    ]

class Notification(models.Model):
    """
    Notification générique pour un utilisateur.
    Types possibles :
    - deadline     : rappel de date limite de tâche
    - assignement  : nouvelle tâche assignée / mise à jour
    - prime        : attribution de prime
    - message      : nouveau message privé reçu
    """

    TYPE_CHOICES = [
        ('deadline', 'Date limite'),
        ('assignement', 'Tâche'),
        ('prime', 'Prime'),
        ('message', 'Message'),
    ]

    user = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='deadline')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)





