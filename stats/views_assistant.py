from django.conf import settings
from django.utils import timezone
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from accounts.models import User
from projects.models import Project
from tasks.models import Task
from .models import Stats, Prime

import requests


class AssistantChatAPIView(APIView):
    """
    Endpoint simple pour le chatbot IA de la plateforme.

    POST /api/assistant/
    body: {
        "message": "...",
        "history": [{ "role": "user" | "assistant", "content": "..." }, ...]
    }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Implémentation basée sur Ollama (serveur local d'IA).

        Prérequis côté machine :
        - Ollama installé et lancé (par défaut sur http://localhost:11434)
        - Modèle téléchargé, par ex. `ollama pull llama3`

        Réglages dans .env :
        - OLLAMA_BASE_URL=http://localhost:11434
        - OLLAMA_MODEL=llama3
        """

        base_url = getattr(settings, "OLLAMA_BASE_URL", "") or "http://localhost:11434"
        model = getattr(settings, "OLLAMA_MODEL", "") or "llama3"

        endpoint = base_url.rstrip("/") + "/api/chat"

        user: User = request.user
        message: str = (request.data.get("message") or "").strip()
        history = request.data.get("history") or []

        if not message:
            return Response(
                {"detail": "Le champ 'message' est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------- Contexte métier pour l'utilisateur courant --------
        # Projets où il est propriétaire ou membre
        user_projects = (
            Project.objects.filter(Q(owner=user) | Q(project_members__user=user))
            .distinct()
            .order_by("-created_at")[:5]
        )

        # Tâches qui le concernent (assignées à lui)
        user_tasks = (
            Task.objects.filter(assigned_to=user)
            .select_related("project")
            .order_by("deadline")[:10]
        )

        # Stats / primes
        user_stats = (
            Stats.objects.filter(user=user)
            .order_by("-year", "-quarter")[:6]
        )
        user_primes = (
            Prime.objects.filter(user=user)
            .order_by("-year")[:3]
        )

        projects_txt = "\n".join(
            f"- {p.name} ({p.project_tasks.count()} tâches)"
            for p in user_projects
        ) or "Aucun projet lié."

        tasks_txt = "\n".join(
            f"- [{t.project.name}] {t.title} (statut={t.status}, "
            f"échéance={t.deadline or 'aucune'})"
            for t in user_tasks
        ) or "Aucune tâche assignée."

        stats_txt = "\n".join(
            f"- {s.period_type} {s.year}"
            f"{' T' + str(s.quarter) if s.quarter else ''}"
            f" : {s.completion_rate}% ({s.completed_tasks}/{s.total_tasks})"
            for s in user_stats
        ) or "Aucune statistique enregistrée."

        primes_txt = "\n".join(
            f"- Année {p.year} : {p.amount}k CFA (taux={p.completion_rate}%)"
            for p in user_primes
        ) or "Aucune prime attribuée."

        system_prompt = f"""
Tu es l'assistant IA de la plateforme ESMT Tasks.
Tu expliques en français, de façon claire et pratique :
- les tâches, projets, rôles, primes et statistiques de l'utilisateur,
- ce qu'il doit faire concrètement (changer un statut, demander validation, aller sur une page, etc.).

Ne divulgue rien sur d'autres utilisateurs que {user.username}.
Si une information n'est pas dans le contexte, dis-le clairement.

Utilisateur actuel :
- Nom affiché : {getattr(user, 'display_name', user.username)}
- Username : @{user.username}
- Rôle : {getattr(user, 'role', '')}

Contexte synthétique :

Projets :
{projects_txt}

Tâches assignées :
{tasks_txt}

Stats :
{stats_txt}

Primes :
{primes_txt}

Date actuelle : {timezone.now().strftime('%d/%m/%Y %H:%M')}
"""

        messages_payload = [{"role": "system", "content": system_prompt}]

        # Historique côté front (limité)
        for item in history[-10:]:
            role = item.get("role")
            content = (item.get("content") or "").strip()
            if role in ("user", "assistant") and content:
                messages_payload.append({"role": role, "content": content})

        messages_payload.append({"role": "user", "content": message})

        # Appel à Ollama (mode non-stream)
        try:
            resp = requests.post(
                endpoint,
                json={
                    "model": model,
                    "messages": messages_payload,
                    "stream": False,
                },
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()
            # Format attendu : {"message": {"role": "assistant", "content": "..."}}
            answer = ""
            if isinstance(data, dict):
                message_obj = data.get("message") or {}
                answer = message_obj.get("content") or ""
        except requests.RequestException as exc:  # pragma: no cover
            return Response(
                {
                    "detail": (
                        "Erreur lors de l'appel à Ollama. "
                        "Vérifie que le serveur tourne bien et que le modèle est disponible. "
                        f"Détail: {exc}"
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not answer:
            answer = (
                "Je n'ai pas pu générer de réponse depuis Ollama. "
                "Vérifie que le modèle est bien installé (par ex. `ollama pull llama3`)."
            )

        return Response(
            {
                "answer": answer,
                "meta": {
                    "projects_count": user_projects.count(),
                    "tasks_count": user_tasks.count(),
                    "stats_count": user_stats.count(),
                },
            }
        )

