# Analyse du code – ESMT Tasks

Rapport d'analyse pour rendre le code propre et maintenable.

---

## 1. Bugs et fautes à corriger

### 1.1 Typo dans le modèle `Project`

**Fichier :** `projects/models.py` (ligne 7)

```python
related_name='owned_projecs'  # ❌ Faute : projecs
```

**Correction :** `owned_projects`

**Impact :** Cohérence des noms et lisibilité du code. Une migration est nécessaire car le `related_name` est utilisé dans les migrations.

---

### 1.2 Import inutilisé dans `config/urls.py`

**Fichier :** `config/urls.py` (ligne 31)

```python
from projects import views  # ❌ Non utilisé
```

**Correction :** Supprimer cet import.

---

## 2. Structure et organisation

### 2.1 Fichier `base.html` trop volumineux (~950 lignes)

**Problème :** CSS, HTML et JavaScript sont mélangés dans un seul fichier, ce qui complique la maintenance.

**Recommandations :**
- Extraire les styles CSS dans des fichiers séparés : `static/css/base.css`, `static/css/components.css`
- Déplacer le JavaScript du widget assistant vers `static/js/assistant-widget.js`
- Garder dans `base.html` uniquement la structure et les blocs

---

### 2.2 Duplication du layout (Django vs Angular)

**Problème :** Sidebar et navigation existent en double :
- Dans `templates/base.html` (Django)
- Dans `frontend/src/app/app.ts` (Angular)

Le `portal_bridge.html` cache des éléments Angular pour réutiliser le layout Django, ce qui multiplie les règles CSS avec `!important`.

**Recommandations :**
- Documenter clairement le choix : Django = pages classiques, Angular = portail `/portal/*`
- Limiter l’usage de `!important` dans `portal_bridge.html`
- Utiliser des classes spécifiques plutôt que des sélecteurs génériques (ex. `.angular-portal-sidebar` au lieu de `app-root .sidebar`)

---

## 3. CSS et styles

### 3.1 Abus de `!important`

**Fichiers concernés :** `portal_bridge.html`, `base.html`, `app.ts`

**Problème :** Environ 25 utilisations de `!important`, ce qui complique le débogage et la maintenance.

**Recommandations :**
- Augmenter la spécificité des sélecteurs
- Utiliser des classes utilitaires ou des variables CSS
- Réserver `!important` aux cas réellement nécessaires (ex. surcharger des librairies)

---

### 3.2 Design tokens dispersés

**Problème :** Couleurs et tailles sont répétées dans plusieurs endroits :
- `base.html` (variables CSS + config Tailwind)
- `portal_bridge.html`
- `frontend/src/styles.css`
- `frontend/tailwind.config.js`

**Recommandations :**
- Centraliser dans un fichier de design tokens : `static/css/tokens.css`
- S’y référer partout (Django et Angular) pour garder une cohérence visuelle

---

## 4. Django – bonnes pratiques

### 4.1 Modèle `ProjectMember` – formatage

**Fichier :** `projects/models.py`

```python
         # class Meta:
       # unique_together = ['user', 'project']  # Indentation incohérente
```

**Correction :** Supprimer le code commenté ou le réindenter correctement.

---

### 4.2 Espacement dans les modèles

**Problème :** Manque d’espaces autour des arguments dans les ForeignKey :

```python
related_name='project_members',on_delete=models.CASCADE  # Peu lisible
```

**Recommandation :**

```python
related_name='project_members', on_delete=models.CASCADE
```

---

### 4.3 Settings – sécurité

**Fichier :** `config/settings.py`

- `DEBUG = True` : à ne pas utiliser en production
- `ALLOWED_HOSTS = ['*']` : trop permissif
- Pas de séparation nette entre dev / staging / production

**Recommandations :**
- Utiliser des variables d’environnement : `DEBUG = config('DEBUG', default=False, cast=bool)`
- Limiter `ALLOWED_HOSTS` à des domaines connus
- Créer `settings/base.py`, `settings/dev.py`, `settings/production.py` si le projet grandit

---

## 5. Frontend Angular

### 5.1 Composant `app.ts` – template trop long

**Problème :** Environ 200 lignes de template inline, difficile à maintenir.

**Recommandation :** Extraire le template dans un fichier `app.component.html`.

---

### 5.2 Styles inline vs classes

**Problème :** Beaucoup de `style="..."` inline dans les composants Angular (assistant-widget, app, chat).

**Recommandation :** Préférer des classes utilitaires (Tailwind) et des styles dans `styles` ou des fichiers `.scss` dédiés pour améliorer la lisibilité.

---

## 6. JavaScript inline dans `base.html`

**Problème :** ~100 lignes de JS pour le widget assistant directement dans le template.

**Recommandations :**
- Déplacer ce code dans `static/js/assistant-widget.js`
- Charger le script via `<script src="{% static 'js/assistant-widget.js' %}">`
- Facilite les tests et la maintenance

---

## 7. Tests et documentation

### 7.1 Tests

**Problème :** Peu de tests visibles pour le flux principal (assistant, chat, intégration Django/Angular).

**Recommandations :**
- Ajouter des tests pour les vues principales (projets, tâches, stats)
- Tester l’API `/api/assistant/`
- Documenter comment lancer la suite de tests

---

### 7.2 Documentation

**Recommandations :**
- Mettre à jour le README avec : démarrage, variables d’environnement, structure du projet
- Ajouter des docstrings aux vues et modèles complexes (ex. `DashboardView`, `AssistantChatAPIView`)

---

## 8. Plan d’action priorisé

| Priorité | Action                                          | Effort |
|----------|--------------------------------------------------|--------|
| P0       | Corriger la typo `owned_projecs` → `owned_projects` | Faible |
| P0       | Supprimer l’import inutilisé dans `config/urls.py`  | Faible |
| P1       | Extraire le JS du widget assistant dans un fichier  | Moyen  |
| P1       | Nettoyer le code commenté et l’indentation dans `projects/models.py` | Faible |
| P2       | Extraire le CSS de `base.html`                      | Moyen  |
| P2       | Réduire l’usage de `!important`                     | Moyen  |
| P3       | Structurer les settings (dev/production)            | Moyen  |
| P3       | Extraire le template de `app.ts` en fichier HTML    | Moyen  |

---

## 9. Résumé

Points positifs :
- Organisation en apps Django claire (accounts, projects, tasks, stats, chat)
- Usage de DRF et JWT pour l’API
- Layout global cohérent (thème sombre)

À améliorer :
- Qualité et lisibilité (typos, imports, formatage)
- Séparation des responsabilités (CSS, JS, templates)
- Configuration de production
- Tests et documentation

---

*Analyse réalisée le 08/03/2025*
