from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import views as auth_views
from django.views import View
from django.views.generic import CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib import messages
from django.urls import reverse_lazy
from .forms import CustomUserCreationForm, UserUpdateForm, ProfileUpdateForm
from .models import Profile


# ─── Inscription ──────────────────────────────────────────────────────────────
class RegisterView(SuccessMessageMixin, CreateView):
    template_name = 'accounts/register.html'
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    success_message = "Votre compte a été créé avec succès. Connectez-vous !"

    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('dashboard')
        return super().dispatch(request, *args, **kwargs)


# ─── Profil ───────────────────────────────────────────────────────────────────
class ProfileView(LoginRequiredMixin, View):
    """
    Affiche et traite le formulaire de mise à jour du profil.
    Gère deux formulaires en parallèle : UserUpdateForm + ProfileUpdateForm.
    """
    template_name = 'accounts/profile.html'

    def _get_or_create_profile(self, user):
        profile, _ = Profile.objects.get_or_create(user=user)
        return profile

    def get(self, request, *args, **kwargs):
        profile = self._get_or_create_profile(request.user)
        context = {
            'user_form':    UserUpdateForm(instance=request.user),
            'profile_form': ProfileUpdateForm(instance=profile),
        }
        return render(request, self.template_name, context)

    def post(self, request, *args, **kwargs):
        profile = self._get_or_create_profile(request.user)
        user_form    = UserUpdateForm(request.POST, instance=request.user)
        profile_form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)

        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, "Votre profil a été mis à jour avec succès.")
            return redirect('profile')

        messages.error(request, "Veuillez corriger les erreurs ci-dessous.")
        context = {
            'user_form':    user_form,
            'profile_form': profile_form,
        }
        return render(request, self.template_name, context)
from django.contrib.auth import logout as django_logout

def logout_view(request):
    django_logout(request)
    return redirect('landing')

from django.db.models import Count, Q
from tasks.models import Task
from .models import User
from projects.models import Project

class MemberDirectoryView(LoginRequiredMixin, View):
    template_name = 'accounts/member_directory.html'

    def get(self, request, *args, **kwargs):
        # Fetch all users with their task counts and profiles
        users = User.objects.select_related('profile').annotate(
            total_tasks=Count('assigned_tasks'),
            completed_tasks=Count('assigned_tasks', filter=Q(assigned_tasks__status='done'))
        ).order_by('-total_tasks')

        # Calculate reliability score on the fly
        member_stats = []
        for u in users:
            reliability = 0
            if u.total_tasks > 0:
                reliability = (u.completed_tasks / u.total_tasks) * 100
            
            member_stats.append({
                'user': u,
                'total_tasks': u.total_tasks,
                'completed_tasks': u.completed_tasks,
                'reliability': round(reliability, 1),
                'role_display': u.get_role_display() if hasattr(u, 'get_role_display') else u.role
            })

        # Sort by reliability descending
        member_stats.sort(key=lambda x: x['reliability'], reverse=True)

        top_members = member_stats[:3]
        owned_projects = Project.objects.filter(owner=request.user).order_by('-created_at')

        return render(
            request,
            self.template_name,
            {
                'members': member_stats,
                'top_members': top_members,
                'owned_projects': owned_projects,
            }
        )

# ─── Suppression de compte ───────────────────────────────────────────────────
class DeleteAccountView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        user = request.user
        django_logout(request)
        user.delete()
        messages.success(request, "Votre compte a été supprimé définitivement.")
        return redirect('landing')


