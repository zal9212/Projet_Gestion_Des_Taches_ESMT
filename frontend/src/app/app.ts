import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { NotificationBellComponent } from './components/notification-bell.component';
import { AssistantWidgetComponent } from './components/assistant-widget.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationBellComponent, AssistantWidgetComponent],
    template: `
    <!-- Background synchronization with Django -->
    <div class="bg-wrapper fixed inset-0 z-0 overflow-hidden" 
         style="background: radial-gradient(ellipse 80% 60% at 50% 100%, #0a1a4a 0%, #060d1f 60%);">
        <div class="absolute inset-0 z-0 bg-wrapper-glow"></div>
        <div class="stars absolute inset-0"></div>
        <div class="mountain absolute bottom-0 left-0 right-0 h-[200px]" 
             style="background: linear-gradient(to top, #050d20, transparent); clip-path: polygon(0% 100%, 0% 70%, 8% 55%, 15% 65%, 22% 40%, 30% 60%, 38% 30%, 48% 55%, 55% 20%, 63% 48%, 72% 35%, 80% 50%, 88% 38%, 95% 52%, 100% 42%, 100% 100%);"></div>
    </div>

    <div class="relative z-10 flex h-screen w-full items-center justify-center p-4 lg:p-6 overflow-hidden font-dmsans">
      
      @if (auth.isAuthenticated()) {
        <!-- LOGGED IN LAYOUT (window) -->
        <div class="flex w-full max-w-[1300px] h-full bg-[#0a122d]/88 backdrop-blur-[20px] rounded-[32px] border border-border-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-500 relative">
          
          <!-- SIDEBAR synchronized with Django -->
          <aside class="sidebar transition-all duration-300 ease-in-out" 
                 [style.width]="sidebarCollapsed() ? '80px' : '260px'"
                 style="position: relative; height: 100%; display: flex; flex-direction: column; padding: 32px 16px; background: rgba(6, 13, 31, 0.4); border-right: 1px solid rgba(255, 255, 255, 0.08); overflow: visible !important; z-index: 50;">
            
            <!-- Sidebar Toggle Button -->
            <button (click)="sidebarCollapsed.set(!sidebarCollapsed())" 
                    class="absolute right-2 top-8 w-8 h-8 rounded-xl flex items-center justify-center text-white border border-white/20 hover:bg-white/10 transition-all z-[100] shadow-2xl"
                    style="background-color: #3b82f6; cursor: pointer; border: 2px solid white;">
                <svg [style.transform]="sidebarCollapsed() ? 'rotate(180deg)' : ''" class="transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <div class="flex items-center justify-center mb-10 overflow-hidden shrink-0 transition-opacity" 
                 [class.opacity-0]="sidebarCollapsed()" [class.h-0]="sidebarCollapsed()">
                <img src="/static/images/logo_esmt.jpg" alt="ESMT Logo" style="height: 64px; width: auto; mix-blend-mode: screen; filter: brightness(1.1);">
            </div>
            
             @if (sidebarCollapsed()) {
               <div class="flex items-center justify-center mb-10 shrink-0">
                  <div class="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center font-bold text-accent-bright font-syne text-xl italic border border-accent/30">E</div>
               </div>
             }

            <nav class="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                @if (!sidebarCollapsed()) {
                    <p style="padding: 0 16px; font-size: 11px; font-weight: 700; color: rgba(200, 215, 240, 0.35); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">Principal</p>
                }
                
                <!-- Mes Projets -->
                <a class="nav-item" href="/" [title]="sidebarCollapsed() ? 'Mes Projets' : ''"
                   style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 500; color: rgba(200, 215, 240, 0.6); text-decoration: none; transition: all 0.2s;">
                    <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                        <path d="M3 10h18" />
                        <path d="M7 15h.01" />
                        <path d="M11 15h.01" />
                    </svg>
                    @if (!sidebarCollapsed()) { <span>Mes Projets</span> }
                </a>

                <!-- Mes Tâches -->
                <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" [title]="sidebarCollapsed() ? 'Mes Tâches' : ''"
                   style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 500; color: rgba(200, 215, 240, 0.6); text-decoration: none; transition: all 0.2s;">
                    <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" />
                    </svg>
                    @if (!sidebarCollapsed()) { <span>Mes Tâches</span> }
                </a>

                <!-- Messages -->
                <a class="nav-item" routerLink="/chat" routerLinkActive="active" [title]="sidebarCollapsed() ? 'Messages' : ''"
                   style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 500; color: rgba(200, 215, 240, 0.6); text-decoration: none; transition: all 0.2s;">
                    <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    @if (!sidebarCollapsed()) { <span>Messages</span> }
                </a>

                <!-- Statistiques & Primes -->
                <a class="nav-item" href="/stats-primes/" [title]="sidebarCollapsed() ? 'Statistiques & Primes' : ''"
                   style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 500; color: rgba(200, 215, 240, 0.6); text-decoration: none; transition: all 0.2s;">
                    <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    @if (!sidebarCollapsed()) { <span>Statistiques & Primes</span> }
                </a>

                <!-- Calendrier -->
                <a class="nav-item" href="javascript:void(0)" onclick="alert('Calendrier bientôt disponible !')" [title]="sidebarCollapsed() ? 'Calendrier' : ''"
                   style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 500; color: rgba(200, 215, 240, 0.6); text-decoration: none; transition: all 0.2s;">
                    <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    @if (!sidebarCollapsed()) { <span>Calendrier</span> }
                </a>
            </nav>

            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                <!-- Paramètres -->
                <a class="nav-item" href="/accounts/profile/" [title]="sidebarCollapsed() ? 'Paramètres' : ''"
                   style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 500; color: rgba(200, 215, 240, 0.6); text-decoration: none; transition: all 0.2s;">
                    <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.07 4.93A10 10 0 113.93 19.07M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2" />
                    </svg>
                    @if (!sidebarCollapsed()) { <span>Paramètres</span> }
                </a>
                <!-- Déconnexion -->
                <a class="nav-item" href="javascript:void(0)" (click)="onLogout()" [title]="sidebarCollapsed() ? 'Déconnexion' : ''"
                   style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 500; color: #f87171; text-decoration: none; transition: all 0.2s;">
                    <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    @if (!sidebarCollapsed()) { <span>Déconnexion</span> }
                </a>
            </div>
          </aside>

          <!-- MAIN CONTENT -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Topbar (Sync with Django base.html) -->
            <!-- Topbar (Sync with Django base.html) -->
            <div class="topbar">
                <div class="breadcrumb">
                    <div class="current">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="1.5" />
                            <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        </svg>
                        Portal
                    </div>
                    <span>/</span>
                    <div class="current" style="color: var(--accent-light);">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {{ currentDate | date:'dd MMM' }}
                    </div>
                </div>

                <div class="topbar-right">
                    <div class="avatar-group">
                        <div class="avatar" style="background:linear-gradient(135deg,#e05252,#c02060)">A</div>
                        <div class="avatar" style="background:linear-gradient(135deg,#52a0e0,#2060c0)">B</div>
                        <div class="avatar" style="background:linear-gradient(135deg,#52e09a,#20c060)">C</div>
                        <div class="avatar add-btn">+</div>
                    </div>
                    <span class="add-member-btn">Membres</span>
                    <div class="icon-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <app-notification-bell></app-notification-bell>
                    <div class="profile-avatar" onclick="window.location.href='/accounts/profile/'">
                        @if (auth.currentUser()?.avatar) {
                            <img [src]="auth.currentUser()?.avatar" style="width:100%; height:100%; object-fit:cover;">
                        } @else {
                            {{ auth.currentUser()?.username?.[0]?.toUpperCase() }}
                        }
                    </div>
                </div>
            </div>
            
            <main class="flex-1 overflow-y-auto">
              <router-outlet />
            </main>
          </div>
        </div>

        <!-- Widget Assistant IA : hors du conteneur overflow pour que l'en-tête soit visible -->
        <app-assistant-widget></app-assistant-widget>
      } @else {
        <!-- LOADING LAYOUT -->
        <div class="flex flex-col items-center justify-center p-8">
            <div class="w-10 h-10 rounded-full border-4 border-accent border-t-transparent animate-spin mb-4"></div>
            <p class="text-txt-sec font-syne animate-pulse text-lg">Vérification de la session en cours...</p>
        </div>
      }
    </div>
  `,
    styles: [`
    .bg-wrapper-glow {
        background: radial-gradient(ellipse 40% 30% at 20% 80%, rgba(30, 60, 140, 0.4) 0%, transparent 70%),
                    radial-gradient(ellipse 30% 25% at 80% 85%, rgba(20, 40, 100, 0.3) 0%, transparent 70%);
    }
  `],
})
export class App {
    auth = inject(AuthService);
    sidebarCollapsed = signal(false);
    currentDate = new Date();

    onLogout() {
        this.auth.logout();
        window.location.href = '/accounts/logout/';
    }
}
