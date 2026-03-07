from accounts.models import User
from accounts.models import Profile

# Créer l'utilisateur admin s'il n'existe pas
if not User.objects.filter(username='admin').exists():
    u = User.objects.create_superuser('admin', 'admin@test.com', 'admin1234')
    u.first_name = 'Admin'
    u.last_name = 'Test'
    u.save()
    Profile.objects.get_or_create(user=u)
    print('Utilisateur admin créé avec succès')
else:
    print('Utilisateur admin existe déjà')
