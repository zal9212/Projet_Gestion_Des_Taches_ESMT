import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-6 lg:p-10 h-full overflow-y-auto flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-700 font-dmsans">
      
      <div>
        <h1 class="font-syne text-3xl font-bold tracking-tight text-txt mb-2">Mon Profil</h1>
        <p class="text-sm text-txt-sec">Gérez vos informations personnelles et votre avatar.</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Aperçu du Profil -->
        <div class="w-full lg:w-80 flex flex-col gap-6">
            <div class="bg-bg-card border border-border-col rounded-3xl p-8 flex flex-col items-center text-center">
                <div class="w-32 h-32 rounded-3xl bg-accent/20 border-2 border-accent/30 flex items-center justify-center text-accent text-4xl font-bold mb-6 overflow-hidden shadow-2xl">
                    @if (auth.currentUser()?.avatar) {
                        <img [src]="auth.currentUser()?.avatar" class="w-full h-full object-cover">
                    } @else {
                        {{ auth.currentUser()?.username?.[0]?.toUpperCase() }}
                    }
                </div>
                <h2 class="text-xl font-bold text-txt mb-1">{{ auth.currentUser()?.full_name || auth.currentUser()?.username }}</h2>
                <span class="px-4 py-1 bg-accent/10 border border-accent/20 rounded-full text-[11px] font-bold text-accent uppercase tracking-widest mb-4">
                    {{ auth.currentUser()?.role }}
                </span>
                <p class="text-xs text-txt-sec leading-relaxed">{{ auth.currentUser()?.bio || 'Aucune biographie disponible.' }}</p>
                
                <div class="w-full h-px bg-border-col my-6"></div>
                
                <div class="w-full flex flex-col gap-4 text-left">
                    <div class="flex items-center justify-between text-[11px]">
                        <span class="text-txt-muted">Email</span>
                        <span class="text-txt-sec font-medium">{{ auth.currentUser()?.email }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Formulaire des Paramètres -->
        <div class="flex-1 bg-bg-card border border-border-col rounded-3xl overflow-hidden flex flex-col">
            <div class="px-8 py-5 border-b border-border-col bg-bg-panel">
                <h3 class="font-syne font-bold text-base text-txt">Modifier les informations</h3>
            </div>
            
            <div class="p-8 flex flex-col gap-8">
                <!-- Section Informations Personnelles -->
                <div>
                    <h4 class="text-[11px] font-bold uppercase tracking-widest text-accent-bright border-b border-border-col pb-2 mb-6">Informations personnelles</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col gap-2">
                             <label class="text-xs font-semibold text-txt-sec">Prénom</label>
                             <input type="text" [value]="auth.currentUser()?.first_name" class="auth-input text-sm" disabled>
                        </div>
                        <div class="flex flex-col gap-2">
                             <label class="text-xs font-semibold text-txt-sec">Nom</label>
                             <input type="text" [value]="auth.currentUser()?.last_name" class="auth-input text-sm" disabled>
                        </div>
                        <div class="flex flex-col gap-2 md:col-span-2">
                             <label class="text-xs font-semibold text-txt-sec">Email</label>
                             <input type="email" [value]="auth.currentUser()?.email" class="auth-input text-sm" disabled>
                        </div>
                    </div>
                </div>

                <!-- Section Avatar -->
                <div>
                    <h4 class="text-[11px] font-bold uppercase tracking-widest text-accent-bright border-b border-border-col pb-2 mb-6">Avatar & Biographie</h4>
                    <div class="flex flex-col gap-6">
                        <div class="flex flex-col gap-2">
                            <label class="text-xs font-semibold text-txt-sec">Biographie</label>
                            <textarea class="auth-input text-sm min-h-[100px] resize-none" [value]="auth.currentUser()?.bio" disabled></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-auto px-8 py-5 border-t border-border-col bg-bg-panel flex justify-end">
                <p class="text-[10px] text-txt-muted mr-auto flex items-center gap-2 italic">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Les modifications sont gérées par l'ESMT.
                </p>
                <button class="px-8 py-2.5 bg-bg-panel border border-border-col rounded-xl text-xs font-bold text-txt-muted cursor-not-allowed opacity-50">
                    Enregistrer (Désactivé)
                </button>
            </div>
        </div>
      </div>

    </div>
  `,
    styles: [],
})
export class ProfileComponent {
    public auth = inject(AuthService);
}
