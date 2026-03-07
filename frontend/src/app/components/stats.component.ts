import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { StatsService } from '../services/stats.service';
import { AuthService } from '../services/auth.service';
import { Stats, Prime, Notification } from '../models/models';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col overflow-hidden animate-in fade-in duration-700 bg-[#060d1f]/50">
      
      <!-- HEADER / TOP NAV -->
      <div class="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0a1228]/60 backdrop-blur-md">
        <div>
            <h1 class="text-3xl font-black text-white font-syne tracking-tight">Analytiques <span class="text-accent-bright">Globales</span></h1>
            <p class="text-xs text-txt-sec mt-1 uppercase tracking-widest font-bold opacity-60">Tableau de bord de performance ESMT</p>
        </div>
        <div class="flex items-center gap-4">
            <div class="flex bg-white/5 p-1 rounded-xl">
                <button (click)="activeTab.set('trimestriel')" class="px-4 py-2 rounded-lg text-xs font-bold transition-all" [class.bg-accent]="activeTab() === 'trimestriel'" [class.text-white]="activeTab() === 'trimestriel'" [class.text-txt-sec]="activeTab() !== 'trimestriel'">Périodes</button>
                <button (click)="activeTab.set('annuel')" class="px-4 py-2 rounded-lg text-xs font-bold transition-all" [class.bg-accent]="activeTab() === 'annuel'" [class.text-white]="activeTab() === 'annuel'" [class.text-txt-sec]="activeTab() !== 'annuel'">Annuel</button>
            </div>
            <button (click)="generate()" [disabled]="isGenerating()" class="bg-white/5 hover:bg-white/10 border border-white/10 text-white p-2.5 rounded-xl transition-all disabled:opacity-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.animate-spin]="isGenerating()"><path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/></svg>
            </button>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        
        <!-- MAIN ANALYTICS CENTER -->
        <div class="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
            
            <!-- OVERVIEW CARDS -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Performance Card -->
                <div class="bg-gradient-to-br from-accent/20 to-transparent border border-white/5 rounded-[28px] p-7 relative overflow-hidden group">
                    <div class="absolute -right-6 -top-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2v20M2 12h20"/></svg>
                    </div>
                    <span class="text-[10px] font-black text-accent-bright uppercase tracking-widest block mb-4">Performance Globale</span>
                    <div class="flex items-baseline gap-2 mb-2">
                        <span class="text-5xl font-black text-white font-syne">{{ averageAnnualRate() }}%</span>
                        <span class="text-xs text-accent-green font-extrabold">+{{ growth() }}%</span>
                    </div>
                    <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div class="h-full bg-accent-bright rounded-full transition-all duration-1000" [style.width.%]="averageAnnualRate()"></div>
                    </div>
                </div>

                <!-- Engagement Card -->
                <div class="bg-white/[0.03] border border-white/5 rounded-[28px] p-7">
                    <span class="text-[10px] font-black text-txt-muted uppercase tracking-widest block mb-4">Engagement</span>
                    <div class="flex items-baseline gap-2 mb-6">
                        <span class="text-5xl font-black text-white font-syne">{{ totalTasks() }}</span>
                        <span class="text-xs text-txt-muted font-bold">Tâches total</span>
                    </div>
                    <div class="flex gap-2">
                        <div class="flex-1 h-1 bg-accent-green rounded-full opacity-40"></div>
                        <div class="flex-1 h-1 bg-accent-bright rounded-full opacity-40"></div>
                        <div class="flex-1 h-1 bg-white/10 rounded-full"></div>
                    </div>
                </div>

                <!-- Primes Card -->
                <div class="bg-white/[0.03] border border-white/5 rounded-[28px] p-7 relative">
                    <span class="text-[10px] font-black text-txt-muted uppercase tracking-widest block mb-4">Primes Total (CFA)</span>
                    <div class="text-5xl font-black text-white font-syne mb-2">{{ totalPrimesAmount() }}K</div>
                    <div class="flex items-center gap-2 text-accent-green">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                        <span class="text-[10px] font-bold uppercase tracking-tighter">{{ primes().length }} Attributions</span>
                    </div>
                </div>
            </div>

            <!-- GROWTH CHART (SVG Line Chart) -->
            <div class="bg-white/[0.02] border border-white/5 rounded-[32px] p-8">
                <div class="flex justify-between items-center mb-10">
                    <div>
                        <h3 class="text-xl font-bold text-white font-syne">Croissance du Profil</h3>
                        <p class="text-xs text-txt-sec mt-1">Évolution du taux de complétion sur les dernières périodes</p>
                    </div>
                    <div class="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-accent-bright"></span> Réalisé</div>
                        <div class="flex items-center gap-2 opacity-30"><span class="w-2 h-2 rounded-full bg-white"></span> Prévision</div>
                    </div>
                </div>
                
                <div class="h-[250px] w-full relative group">
                    <!-- Grid Lines -->
                    <div class="absolute inset-0 flex flex-col justify-between opacity-5">
                        <div class="w-full h-px bg-white"></div>
                        <div class="w-full h-px bg-white"></div>
                        <div class="w-full h-px bg-white"></div>
                        <div class="w-full h-px bg-white"></div>
                    </div>

                    <!-- SVG Chart -->
                    <svg viewBox="0 0 1000 250" class="w-full h-full preserve-3d overflow-visible">
                        <!-- Defs for gradient -->
                        <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#3b6ff5" stop-opacity="0.5" />
                                <stop offset="100%" stop-color="#3b6ff5" stop-opacity="0" />
                            </linearGradient>
                        </defs>
                        
                        <!-- Area Fill -->
                        <path [attr.d]="chartPath(true)" fill="url(#lineGrad)" class="transition-all duration-1000" />
                        
                        <!-- Line -->
                        <path [attr.d]="chartPath(false)" fill="none" stroke="#3b6ff5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="transition-all duration-1000" />
                        
                        <!-- Data Points -->
                        @for (p of chartPoints(); track $index) {
                            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="6" fill="#060d1f" stroke="#3b6ff5" stroke-width="3" class="hover:r-8 transition-all cursor-crosshair">
                                <title>Taux: {{ p.val }}%</title>
                            </circle>
                        }
                    </svg>

                    <!-- X-Axis Labels -->
                    <div class="flex justify-between mt-6 px-2 text-[10px] font-bold text-txt-muted uppercase tracking-widest">
                        @for (s of chartStats(); track s.id) {
                            <span>{{ s.period_type === 'trimestriel' ? 'T' + s.quarter : s.year }}</span>
                        } @empty {
                            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
                        }
                    </div>
                </div>
            </div>

            <!-- PERIOD DETAILS GRID -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                @for (s of filteredStats(); track s.id) {
                    <div class="bg-white/[0.03] border border-white/5 rounded-[24px] p-6 hover:bg-white/[0.05] transition-all group">
                         <div class="flex items-center gap-6">
                            <div class="relative w-20 h-20 shrink-0">
                                <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
                                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3" />
                                    <circle cx="18" cy="18" r="16" fill="none" [attr.stroke]="s.completion_rate >= 90 ? '#22c55e' : '#3b6ff5'" stroke-width="3" [attr.stroke-dasharray]="s.completion_rate + ', 100'" stroke-linecap="round" class="transition-all duration-1000" />
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center flex-col">
                                    <span class="text-sm font-black text-white leading-none">{{ s.completion_rate }}%</span>
                                </div>
                            </div>
                            <div class="flex-1">
                                <span class="text-[9px] font-bold text-accent-bright uppercase tracking-widest block mb-1">
                                    {{ s.period_type === 'trimestriel' ? 'Performance Trimestrielle' : 'Bilan Annuel' }}
                                </span>
                                <h4 class="text-lg font-bold text-white font-syne mb-2">
                                    {{ s.period_type === 'trimestriel' ? 'Trimestre ' + s.quarter : 'Année' }} {{ s.year }}
                                </h4>
                                <div class="flex gap-4">
                                    <div class="text-[10px] text-txt-sec"><strong>{{ s.completed_tasks }}</strong> Terminées</div>
                                    <div class="text-[10px] text-txt-sec"><strong>{{ s.total_tasks }}</strong> Total</div>
                                </div>
                            </div>
                            @if (s.completion_rate >= 90) {
                                <div class="bg-accent-green/10 text-accent-green px-3 py-1 rounded-full text-[9px] font-black uppercase">Éligible Prime</div>
                            }
                         </div>
                    </div>
                }
            </div>

        </div>

        <!-- ANALYTICS SIDEBAR -->
        <div class="w-[400px] border-l border-white/5 bg-[#0a1228]/40 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar hidden lg:block space-y-10">
            
            <!-- Prime Hall of Fame -->
            <div>
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-sm font-black text-white uppercase tracking-[0.2em]">Historique Primes</h3>
                    <div class="w-8 h-8 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green animate-pulse">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                </div>
                
                <div class="space-y-4">
                    @for (p of primes(); track p.id) {
                        <div class="p-6 rounded-3xl bg-white/[0.03] border border-white/5 relative group hover:border-accent-green/30 transition-all">
                             <div class="absolute top-4 right-4 text-[10px] font-black text-accent-green">{{ p.year }}</div>
                             <div class="text-3xl font-black text-white font-syne">{{ p.amount }}K</div>
                             <p class="text-[10px] text-txt-sec mt-1 uppercase tracking-tighter">Attribution d'excellence</p>
                             <div class="mt-4 flex items-center gap-2">
                                <div class="flex-1 h-1 bg-white/5 rounded-full"><div class="h-full bg-accent-green rounded-full" [style.width.%]="p.completion_rate"></div></div>
                                <span class="text-[9px] font-bold text-accent-green">{{ p.completion_rate }}%</span>
                             </div>
                        </div>
                    } @empty {
                        <div class="py-12 text-center border border-dashed border-white/5 rounded-3xl opacity-40">
                            <p class="text-xs italic text-txt-muted">Aucune récompense trouvée.</p>
                        </div>
                    }
                </div>
            </div>

            <!-- Activity Log -->
            <div>
                <h3 class="text-sm font-black text-white uppercase tracking-[0.2em] mb-6">Journal d'activité</h3>
                <div class="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                    @for (n of notifications(); track n.id) {
                        <div class="pl-10 relative group" [class.opacity-50]="n.is_read">
                            <div class="absolute left-3 top-1.5 w-2 h-2 rounded-full border-2 border-accent bg-[#060d1f] group-hover:scale-125 transition-transform"></div>
                            <p class="text-xs text-txt-main leading-relaxed mb-1">{{ n.message }}</p>
                            <div class="flex justify-between items-center">
                                <span class="text-[9px] text-txt-sec font-bold uppercase">{{ n.created_at | date:'dd MMM' }}</span>
                                @if (!n.is_read) {
                                    <button (click)="markAsRead(n)" class="text-[9px] font-bold text-accent-bright hover:underline">Lu</button>
                                }
                            </div>
                        </div>
                    } @empty {
                        <p class="text-xs text-txt-dim italic text-center py-5">Aucune activité récente.</p>
                    }
                </div>
            </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 111, 245, 0.2); border-radius: 10px; }
    .preserve-3d { transform-style: preserve-3d; }
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

  totalTasks = computed(() => this.stats().reduce((acc, s) => acc + s.total_tasks, 0));

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

  chartStats = computed(() => {
    return [...this.stats()]
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return (a.quarter || 0) - (b.quarter || 0);
      })
      .slice(-6); // Last 6 points
  });

  chartPoints = computed(() => {
    const stats = this.chartStats();
    if (stats.length === 0) return [];

    return stats.map((s, i) => {
      const x = (i / (stats.length - 1)) * 950 + 25;
      const y = 220 - (+s.completion_rate / 100) * 200;
      return { x, y, val: s.completion_rate };
    });
  });

  chartPath(isFill: boolean) {
    const points = this.chartPoints();
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    // Use cubic bezier for smooth curves
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      path += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    if (isFill) {
      path += ` L ${points[points.length - 1].x} 250 L ${points[0].x} 250 Z`;
    }

    return path;
  }

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
