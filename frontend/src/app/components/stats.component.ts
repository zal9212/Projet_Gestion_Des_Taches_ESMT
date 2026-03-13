import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatsService } from '../services/stats.service';
import { AuthService } from '../services/auth.service';
import { Stats, Prime, Notification } from '../models/models';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-full flex flex-col overflow-hidden bg-[#060d1f] text-white font-dmsans animate-in fade-in duration-500">
      
      <!-- BARRE DE NAVIGATION SUPÉRIEURE -->
      <div class="px-10 py-6 border-b border-white/[0.08] flex justify-between items-center bg-[#0a1228]">
        <div>
            <h1 class="text-2xl font-bold font-syne tracking-tight">Tableau de Bord <span class="text-accent underline underline-offset-8 decoration-2 opacity-80">Analytique</span></h1>
            <p class="text-[10px] text-txt-sec uppercase tracking-widest mt-1 font-bold">Rapport de performance ESMT</p>
        </div>
        
        <div class="flex items-center gap-4">
            <!-- Sélecteur de Période -->
            <div class="flex bg-white/[0.05] p-1 rounded-xl border border-white/[0.1]">
                <button (click)="activeTab.set('trimestriel')" 
                    class="px-5 py-2 rounded-lg text-xs font-bold transition-all" 
                    [class.bg-accent]="activeTab() === 'trimestriel'" 
                    [class.text-white]="activeTab() === 'trimestriel'" 
                    [class.text-txt-sec]="activeTab() !== 'trimestriel'">
                    Trimestriel
                </button>
                <button (click)="activeTab.set('annuel')" 
                    class="px-5 py-2 rounded-lg text-xs font-bold transition-all" 
                    [class.bg-accent]="activeTab() === 'annuel'" 
                    [class.text-white]="activeTab() === 'annuel'" 
                    [class.text-txt-sec]="activeTab() !== 'annuel'">
                    Annuel
                </button>
            </div>

            <button (click)="generate()" [disabled]="isGenerating()" 
                class="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] flex items-center justify-center transition-colors disabled:opacity-50">
                <svg width="9" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.animate-spin]="isGenerating()">
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
            </button>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        
        <!-- APERÇU PRINCIPAL DES ANALYSES -->
        <div class="flex-1 p-10 overflow-y-auto custom-scrollbar-sleek space-y-10">
            
            <!-- INDICATEURS CLÉS -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Indicateur de Taux -->
                <div class="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all overflow-hidden flex flex-col justify-center">
                    <div class="text-[9px] font-black text-txt-sec uppercase tracking-[0.2em] mb-3 truncate">Taux de réussite</div>
                    <div class="flex items-center gap-2">
                        <span class="text-xl font-bold truncate">{{ averageAnnualRate() }}%</span>
                        @if (growth() > 0) {
                            <span class="bg-accent-green/10 text-accent-green text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0">↑ {{ growth() }}%</span>
                        }
                    </div>
                </div>

                <!-- Indicateur de Volume -->
                <div class="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all overflow-hidden flex flex-col justify-center">
                    <div class="text-[9px] font-black text-txt-sec uppercase tracking-[0.2em] mb-3 truncate">Tâches réalisées</div>
                    <div class="text-xl font-bold truncate">{{ totalTasks() }} <span class="text-[9px] text-txt-muted uppercase font-bold tracking-wide">Units</span></div>
                </div>

                <!-- Indicateur de Prime -->
                <div class="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.05] transition-all overflow-hidden flex flex-col justify-center">
                    <div class="text-[9px] font-black text-txt-sec uppercase tracking-[0.2em] mb-3 truncate">Primes cumulées (CFA)</div>
                    <div class="text-xl font-bold text-accent-yellow truncate">{{ totalPrimesAmount() }}K</div>
                </div>
            </div>

            <!-- DÉTAILS DE LA PÉRIODE -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                @for (s of filteredStats(); track s.id) {
                    <div class="flex items-center justify-between p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-white/10 transition-colors">
                        <div>
                            <div class="text-[9px] font-bold text-accent uppercase tracking-[0.2em] mb-1">
                                {{ s.period_type === 'trimestriel' ? 'Performance Trimestrielle' : 'Bilan Annuel' }}
                            </div>
                            <h4 class="text-base font-bold font-syne">
                                {{ s.period_type === 'trimestriel' ? 'Trimestre ' + s.quarter : 'Années' }} {{ s.year }}
                            </h4>
                            <div class="flex gap-4 mt-2">
                                <span class="text-[10px] text-txt-muted"><strong>{{ s.completed_tasks }}</strong> réussies</span>
                                <span class="text-[10px] text-txt-muted"><strong>{{ s.total_tasks }}</strong> au total</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-black font-syne mb-2" [class.text-accent-green]="s.completion_rate >= 90" [class.text-accent]="s.completion_rate < 90">
                                {{ s.completion_rate }}%
                            </div>
                            @if (s.completion_rate >= 90) {
                                <span class="text-[8px] font-black uppercase bg-accent-green/20 text-accent-green px-2 py-1 rounded-md">Éligible Prime</span>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>

        <!-- BARRE LATÉRALE DROITE : FLUX ET RÉCOMPENSES -->
        <div class="w-[400px] border-l border-white/[0.08] bg-[#0a1228]/50 p-10 overflow-y-auto custom-scrollbar-sleek hidden xl:block space-y-12">
            
            <!-- LISTE DES PRIMES -->
            <div>
                <h3 class="text-xs font-black text-white uppercase tracking-[0.3em] font-syne mb-8 opacity-40">Historique des Primes</h3>
                <div class="space-y-4">
                    @for (p of primes(); track p.id) {
                        <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                            <div class="flex justify-between items-start mb-4">
                                <div class="text-lg font-bold text-white truncate pr-2">{{ p.amount }}K <span class="text-[9px] text-txt-muted ml-0.5 uppercase">CFA</span></div>
                                <span class="text-[9px] font-bold text-accent-yellow bg-accent-yellow/10 px-1.5 py-0.5 rounded-md flex-shrink-0">{{ p.year }}</span>
                            </div>
                            <div class="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div class="h-full bg-accent-yellow" [style.width.%]="p.completion_rate"></div>
                            </div>
                            <p class="text-[9px] text-txt-muted mt-2 font-bold uppercase tracking-wider">Performance de {{ p.completion_rate }}%</p>
                        </div>
                    } @empty {
                        <div class="py-12 text-center border border-dashed border-white/10 rounded-2xl opacity-30">
                            <p class="text-xs italic">Aucune prime pour le moment.</p>
                        </div>
                    }
                </div>
            </div>

            <!-- FLUX DE NOTIFICATIONS -->
            <div>
                <h3 class="text-xs font-black text-white uppercase tracking-[0.3em] font-syne mb-8 opacity-40">Dernières Activités</h3>
                <div class="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                    @for (n of notifications(); track n.id) {
                        <div class="pl-8 relative group" [class.opacity-40]="n.is_read">
                            <div class="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-[#060d1f] border-2 border-accent"></div>
                            <p class="text-[12px] text-txt-main leading-snug mb-2">{{ n.message }}</p>
                            <div class="flex items-center justify-between">
                                <span class="text-[9px] font-bold text-txt-muted uppercase">{{ n.created_at | date:'dd MMM, HH:mm' }}</span>
                                @if (!n.is_read) {
                                    <button (click)="markAsRead(n)" class="text-[9px] font-bold text-accent hover:underline">Marquer lu</button>
                                }
                            </div>
                        </div>
                    } @empty {
                        <p class="text-xs text-txt-muted italic text-center py-10 opacity-30">Pas d'activité récente.</p>
                    }
                </div>
            </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar-sleek::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar-sleek::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar-sleek::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
  `]
})
export class StatsComponent implements OnInit {
  statsService = inject(StatsService);
  auth = inject(AuthService);

  stats = signal<Stats[]>([]);
  primes = signal<Prime[]>([]);
  notifications = signal<Notification[]>([]);
  activeTab = signal<'trimestriel' | 'annuel'>('trimestriel');
  isGenerating = signal(false);

  filteredStats = computed(() =>
    this.stats().filter(s => s.period_type === this.activeTab())
  );

  totalTasks = computed(() => {
    // Filtre sur "annuel" pour éviter le double comptage (trimestriel + annuel)
    const annualStats = this.stats().filter(s => s.period_type === 'annuel');
    return annualStats.reduce((acc, s) => acc + s.completed_tasks, 0);
  });

  averageAnnualRate = computed(() => {
    const annualStats = this.stats().filter(s => s.period_type === 'annuel');
    if (annualStats.length === 0) return 0;
    const sum = annualStats.reduce((acc, s) => acc + +s.completion_rate, 0);
    return Math.round(sum / annualStats.length);
  });

  totalPrimesAmount = computed(() => {
    return this.primes().reduce((acc, p) => acc + +p.amount, 0);
  });

  growth = computed(() => {
    const annual = this.stats().filter(s => s.period_type === 'annuel').sort((a, b) => b.year - a.year);
    if (annual.length < 2) return 0;
    return Math.round(+annual[0].completion_rate - +annual[1].completion_rate);
  });

  ngOnInit() { this.loadData(); }

  loadData() {
    this.statsService.getStats().subscribe(data => this.stats.set(data));
    this.statsService.getPrimes().subscribe(data => this.primes.set(data));
    this.statsService.getNotifications().subscribe(data => this.notifications.set(data));
  }

  generate() {
    this.isGenerating.set(true);
    this.statsService.generateStats().subscribe({
      next: () => {
        this.loadData();
        this.isGenerating.set(false);
      },
      error: () => this.isGenerating.set(false)
    });
  }

  markAsRead(n: Notification) {
    this.statsService.markAsRead(n.id).subscribe(() => this.loadData());
  }
}
