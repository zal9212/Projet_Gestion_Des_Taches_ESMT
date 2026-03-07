# Configuration des Agents IA (Antigravity)

Ce fichier regroupe la configuration et les instructions pour booster le développement de l'application de Gestion des Tâches (Frontend Angular + Backend Django) en utilisant des serveurs MCP (Model Context Protocol).

## 🚀 Serveurs MCP Recommandés

Pour tirer le maximum des capacités de l'agent Antigravity sur ce projet, les serveurs MCP suivants sont fortement recommandés. Ils permettent à l'IA d'interagir directement avec ton environnement local :

### 1. Serveur SQLite (`@modelcontextprotocol/server-sqlite`)
**Rôle :** Permet à l'agent d'explorer la base de données SQLite du projet Django. L'agent pourra lire les schémas des tables (Projets, Tâches, Utilisateurs) et exécuter des requêtes pour vérifier l'état des données.
- **Commande d'exécution :** `npx -y @modelcontextprotocol/server-sqlite db.sqlite3`

### 2. Serveur Filesystem (`@modelcontextprotocol/server-filesystem`)
**Rôle :** Permet à l'agent de lire et d'écrire en toute sécurité dans les répertoires spécifiques de ton projet. Cela facilite la génération de composants Angular ou la modification des vues et des modèles Django.
- **Commande d'exécution :** `npx -y @modelcontextprotocol/server-filesystem ./`

### 3. Serveur Fetch (`@modelcontextprotocol/server-fetch`)
**Rôle :** Permet à l'agent de tester en direct ton API REST (`http://127.0.0.1:8000/api/...`) comme le ferait Postman, pour valider que le backend fonctionne correctement avant de l'intégrer dans le frontend Angular.
- **Commande d'exécution :** `npx -y @modelcontextprotocol/server-fetch`

---

## 🛠️ Comment utiliser l'Agent sur ce projet ?

Puisque tu utilises **Antigravity**, tu peux me demander directement d'effectuer des tâches complexes impliquant ces outils :

- **Backend (Django) :** *"Analyse mon modèle Projet dans `projects/models.py` et crée le serializer DRF correspondant."*
- **Frontend (Angular) :** *"Génère un composant Angular pour afficher la liste des tâches (Objectif 3 du cahier des charges), en te basant sur la route API `http://127.0.0.1:8000/api/projects/`."*
- **Base de données :** *"Quelles sont les données actuellement présentes dans ma base SQLite concernant les utilisateurs (professeurs vs étudiants) ?"*

## 📝 Cahier des Charges - Rappel Rapide
- **Technologies** : Django (Backend / API), DRF (REST), Angular ou React (Frontend, Objectif 2), SQLite/PostgreSQL.
- **Authentification** : Gestion par token (JWT).
- **Objectif principal** : Gérer des tâches (Titres, descriptions, statuts) assignées à des projets pour des enseignants et des étudiants (ESMT).
