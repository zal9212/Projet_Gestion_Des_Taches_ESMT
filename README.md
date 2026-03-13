# ESMT Tasks

Application web collaborative de gestion de projets et de tâches, développée dans le cadre du cours LTI3-DAR à l'École Supérieure Multinationale des Télécommunications (ESMT).

---

## Présentation

ESMT Tasks est une plateforme de gestion du travail collaboratif destinée aux enseignants et aux étudiants. Elle permet de créer des projets, d'assigner des tâches, de suivre leur avancement et d'évaluer automatiquement les performances des enseignants via un système de calcul de primes basé sur le taux de complétion des tâches.

L'application repose sur une architecture Django monolithique exposant une API REST consommée par un portail Angular intégré, sans nécessiter de serveur frontend séparé.

---

## Stack Technique

| Couche | Technologie |
|---|---|
| Backend | Django 6.0, Django REST Framework |
| Authentification | SimpleJWT (Access + Refresh Token) |
| Temps réel | Django Channels (InMemoryChannelLayer) |
| Planificateur | APScheduler (rappels email automatiques) |
| Frontend | Angular 17 (portail intégré via frontend_bridge) |
| Base de données | SQLite en mode WAL (développement) |
| Notifications email | SMTP Gmail |

---

## Fonctionnalites

- Inscription et connexion avec deux rôles distincts : Etudiant et Professeur
- Gestion de projets avec système de membres (création, modification, suppression)
- Gestion de tâches avec statuts (A faire, En cours, Termine) et validation par le propriétaire
- Tableau de bord personnalisé avec graphique de contributions style GitHub
- Systeme de rappels automatiques par email (1 semaine, 48h et 24h avant deadline)
- Chat en temps réel via WebSocket avec historique persistant et support des pièces jointes
- Calendrier interactif des deadlines avec export vers Google Calendar
- Module statistiques et calcul automatique des primes annuelles (30 000 ou 100 000 CFA)
- Annuaire des membres avec score de fiabilité calculé en temps réel
- Notifications in-app (tâche, deadline, prime, message)
- Interface d'administration Django complète
- Suite de tests unitaires avec pytest-django

---

## Installation

### Prérequis

- Python 3.10 ou supérieur
- Node.js 18+ et npm 9+ (uniquement pour recompiler le frontend Angular)
- Git

### Etapes d'installation

**1. Cloner le dépôt**

```bash
git clone <url-du-depot>
cd esmt_tasks
```

**2. Créer et activer l'environnement virtuel**

```powershell
# Windows
python -m venv venv
.\venv\Scripts\activate
```

```bash
# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

**3. Installer les dépendances**

```bash
pip install -r requirements.txt
```

**4. Configurer les variables d'environnement**

```bash
copy .env.example .env
```

Renseigner les valeurs dans le fichier `.env` :

```env
SECRET_KEY=votre_cle_secrete_django
EMAIL_ADDRESS=votre_adresse@gmail.com
PASSWORD=votre_mot_de_passe_application
```

**5. Appliquer les migrations**

```bash
python manage.py migrate
```

**6. Créer un compte administrateur**

```bash
python manage.py createsuperuser
```

**7. Lancer le serveur**

```bash
python manage.py runserver
```

---

## Acces a l'application

| Interface | URL |
|---|---|
| Page d'accueil | http://127.0.0.1:8000/ |
| Tableau de bord | http://127.0.0.1:8000/dashboard/ |
| Portail Angular | http://127.0.0.1:8000/portal/ |
| API REST | http://127.0.0.1:8000/api/ |
| Administration Django | http://127.0.0.1:8000/admin/ |

---

## Structure du Projet

```
esmt_tasks/
├── accounts/          # Utilisateurs, profils, annuaire des membres
├── projects/          # Projets et membres de projet
├── tasks/             # Tâches, statuts, validation, rappels automatiques
├── stats/             # Statistiques, primes, notifications
├── chat/              # Messagerie temps réel (WebSocket)
├── frontend/          # Application Angular (portail interactif)
├── frontend_bridge/   # Module de liaison Django - Angular
├── config/            # Configuration Django (settings, urls, asgi)
├── templates/         # Templates HTML Django
├── static/            # Fichiers statiques et bundle Angular compilé
├── media/             # Fichiers uploadés (avatars, pièces jointes)
├── manage.py
├── pytest.ini
└── requirements.txt
```

---

## API REST

L'API est accessible sous le préfixe `/api/`. L'authentification utilise des tokens JWT transmis dans l'en-tête HTTP :

```
Authorization: Bearer <access_token>
```

Principaux groupes de routes :

| Groupe | Préfixe |
|---|---|
| Authentification JWT | /api/token/ |
| Projets | /api/projects/ |
| Membres | /api/members/ |
| Tâches | /api/tasks/ |
| Statistiques | /api/stats/ |
| Primes | /api/primes/ |
| Notifications | /api/notifications/ |
| Chat | /api/chat/ |

---

## Tests

```bash
# Lancer tous les tests
pytest

# Tester un module spécifique
pytest accounts/tests.py
pytest projects/tests.py
pytest tasks/tests.py
pytest stats/tests.py

# Afficher la couverture de code
pytest --cov=. --cov-report=html
```

---

## Règle de calcul des primes

Le taux de complétion est calculé sur l'année entière selon la formule :

```
Taux = (Tâches terminées / Tâches assignées) x 100
```

| Taux de complétion | Prime attribuée |
|---|---|
| 100 % | 100 000 CFA |
| >= 90 % | 30 000 CFA |
| < 90 % | Aucune prime |

---

## Licence

Projet académique — ESMT, Cours LTI3-DAR, 2026.
