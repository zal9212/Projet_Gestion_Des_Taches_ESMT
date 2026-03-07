import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../services/project.service';
import { Task, TaskStatus } from '../models/models';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col gap-5 p-6 lg:p-8 overflow-y-auto font-dmsans animate-in fade-in duration-700 relative">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-syne text-4xl font-bold tracking-tight text-txt leading-tight">
            Calendrier <span class="text-accent-bright">des Tâches</span>
          </h1>
          <p class="text-sm text-txt-sec mt-1">Cliquez sur une tâche pour voir les détails et l'ajouter à Google Calendar.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="prevMonth()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-border-col text-txt hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span class="font-syne font-bold text-txt text-lg min-w-[200px] text-center capitalize">{{ currentMonthLabel() }}</span>
          <button (click)="nextMonth()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-border-col text-txt hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button (click)="goToToday()" class="px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent font-bold text-sm hover:bg-accent/20 transition-all">
            Aujourd'hui
          </button>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-5 text-xs font-medium text-txt-muted">
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-yellow-500/50 border border-yellow-500/30"></span> À faire</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-purple-500/50 border border-purple-500/30"></span> En cours</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-green-500/50 border border-green-500/30"></span> Terminée</div>
        <div class="flex items-center gap-2 text-[#4285f4]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
          Lier à Google Calendar
        </div>
      </div>

      <!-- Day Names -->
      <div class="grid grid-cols-7 gap-1.5">
        @for (name of dayNames; track name) {
          <div class="text-center text-[10px] font-bold text-txt-muted uppercase tracking-widest py-1.5">{{ name }}</div>
        }
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-1.5">
        @for (day of calendarDays(); track day.date.toISOString()) {
          <div [class]="getDayClass(day)">
            <div class="flex items-center justify-between mb-1">
              <span [class]="day.isToday
                ? 'w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[11px] font-bold shadow-lg shadow-accent/40'
                : 'text-[11px] font-bold ' + (day.inMonth ? 'text-txt-muted' : 'text-white/10')">
                {{ day.date.getDate() }}
              </span>
            </div>
            @for (task of day.tasks; track task.id) {
              <button (click)="openTask(task, $event)" [class]="getChipClass(task.status)" [title]="task.title">
                {{ task.title.length > 16 ? task.title.substring(0, 16) + '…' : task.title }}
              </button>
            }
          </div>
        }
      </div>

      <!-- No-deadline tasks -->
      @if (tasksWithoutDeadline().length > 0) {
        <div class="bg-bg-card border border-border-col rounded-2xl p-5 mt-2">
          <p class="text-[10px] font-bold uppercase tracking-widest text-txt-muted mb-3">
            {{ tasksWithoutDeadline().length }} tâche(s) sans date limite
          </p>
          <div class="flex flex-wrap gap-2">
            @for (task of tasksWithoutDeadline(); track task.id) {
              <button (click)="openTask(task, $event)" [class]="getChipClass(task.status) + ' !inline-flex cursor-pointer'">{{ task.title }}</button>
            }
          </div>
        </div>
      }

      <!-- ── TASK DETAIL POPUP  ── -->
      @if (selectedTask()) {
        <div class="fixed inset-0 z-40" (click)="closeTask()"></div>
        <div
          class="absolute z-50 w-72 max-h-[88vh] overflow-y-auto bg-[#1a2340] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in zoom-in-95 fade-in duration-200"
          [style.top.px]="popupY()"
          [style.left.px]="popupX()">

          <!-- 1. Header with Background and Title -->
          <div [class]="'p-5 pb-6 rounded-t-2xl relative ' + getHeaderBgClass(selectedTask()!.status)">
            <!-- Close -->
            <button (click)="closeTask()" class="absolute top-4 right-4 text-black/40 hover:text-black/70 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <h3 class="font-syne font-bold text-[#060d1f] text-lg leading-tight pr-6">{{ selectedTask()!.title }}</h3>
          </div>

          <div class="p-5">
            <!-- Info rows -->
            <div class="space-y-4 text-sm mt-1">

              <!-- Date & Time -->
              <div class="flex items-start gap-4 text-txt-sec">
                <svg class="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div class="flex-1">
                  <p class="font-medium text-[#4f7fff]">{{ formatDeadline(selectedTask()!.deadline || '') }}</p>
                </div>
              </div>

              <!-- Type (Custom label like the image) -->
              <div class="flex items-start gap-4 text-txt-sec">
                <svg class="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div class="flex-1">
                  <p class="font-medium">Événement de cours</p>
                </div>
              </div>

              <!-- Project -->
              <div class="flex items-start gap-4 text-txt-sec">
                 <svg class="w-5 h-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                 <div class="flex-1">
                  <p class="font-medium text-[#4f7fff]">{{ selectedTask()!.project_name || 'Projet ESMT' }}</p>
                </div>
              </div>

              <!-- Status Badge (extra info not in image but useful) -->
              <div class="flex items-start gap-4">
                <div class="w-5"></div>
                <span [class]="getStatusBadgeClass(selectedTask()!.status)">{{ getStatusLabel(selectedTask()!.status) }}</span>
              </div>

              <!-- Description -->
              @if (selectedTask()!.description) {
                <div class="bg-white/5 rounded-xl px-4 py-3 text-xs text-txt-sec leading-relaxed ml-9">
                  {{ selectedTask()!.description }}
                </div>
              }
            </div>

      
            

            <!-- Google Calendar Button (below, as functional addition) -->
            @if (selectedTask()!.deadline) {
              <div class="mt-4">
                <a [href]="getGCalUrl(selectedTask()!)" target="_blank" rel="noopener"
                   class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all bg-[#4285f4] hover:bg-[#5a95f5] text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7-2h2v-5h-2v5zm-4 0h2v-3H8v3zm8 0h2v-7h-2v7z"/></svg>
                  Sync Google Calendar
                </a>
                <p class="text-center text-[9px] text-txt-muted mt-2 uppercase tracking-tighter">Rappels : 1 semaine · 48h · 24h</p>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; }
    .cal-day { min-height: 90px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 7px; transition: background 0.2s; }
    .cal-day:hover { background: rgba(255,255,255,0.05); }
    .cal-day-today { min-height: 90px; background: rgba(59,111,245,0.08); border: 1.5px solid rgba(59,111,245,0.5); border-radius: 10px; padding: 7px; }
    .cal-day-other { min-height: 90px; background: transparent; border: 1px solid rgba(255,255,255,0.02); border-radius: 10px; padding: 7px; opacity: 0.2; }
    .chip-todo { display: block; width: 100%; text-align: left; font-size: 10px; font-weight: 600; padding: 3px 6px; border-radius: 5px; margin-bottom: 2px; background: rgba(234,179,8,0.2); color: #eab308; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: none; cursor: pointer; transition: opacity 0.15s; }
    .chip-todo:hover { opacity: 0.7; }
    .chip-in_progress { display: block; width: 100%; text-align: left; font-size: 10px; font-weight: 600; padding: 3px 6px; border-radius: 5px; margin-bottom: 2px; background: rgba(168,85,247,0.2); color: #a855f7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: none; cursor: pointer; transition: opacity 0.15s; }
    .chip-in_progress:hover { opacity: 0.7; }
    .chip-done { display: block; width: 100%; text-align: left; font-size: 10px; font-weight: 600; padding: 3px 6px; border-radius: 5px; margin-bottom: 2px; background: rgba(34,197,94,0.15); color: #22c55e; text-decoration: line-through; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: none; cursor: pointer; transition: opacity 0.15s; }
    .chip-done:hover { opacity: 0.7; }
  `]
})
export class CalendarComponent implements OnInit {
  private taskService = inject(TaskService);

  allTasks = signal<Task[]>([]);
  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth());

  selectedTask = signal<Task | null>(null);
  popupX = signal(0);
  popupY = signal(0);

  dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  ngOnInit() {
    this.taskService.getTasks().subscribe(tasks => this.allTasks.set(tasks));
  }

  currentMonthLabel = computed(() =>
    `${this.monthNames[this.currentMonth()]} ${this.currentYear()}`
  );

  calendarDays = computed((): CalendarDay[] => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay();
    startDow = (startDow === 0) ? 6 : startDow - 1;

    const days: CalendarDay[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), inMonth: false, isToday: false, tasks: [] });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i); d.setHours(0, 0, 0, 0);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const tasks = this.allTasks().filter(t => t.deadline && t.deadline.startsWith(dateStr));
      days.push({ date: d, inMonth: true, isToday: d.getTime() === today.getTime(), tasks });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), inMonth: false, isToday: false, tasks: [] });
    }
    return days;
  });

  tasksWithoutDeadline = computed(() => this.allTasks().filter(t => !t.deadline));

  openTask(task: Task, event: MouseEvent) {
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();

    const container = el.closest('.relative') as HTMLElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const PW = 288;
    const PH = 450;
    const margin = 16;

    let x = rect.right - containerRect.left + margin;
    if (x + PW > containerRect.width - margin) {
      x = rect.left - containerRect.left - PW - margin;
    }
    x = Math.max(margin, Math.min(x, containerRect.width - PW - margin));

    let y = rect.top - containerRect.top + container.scrollTop;
    if (y + PH > container.scrollHeight - margin) {
      y = Math.max(margin, container.scrollHeight - PH - margin);
    }

    this.popupX.set(x);
    this.popupY.set(y);
    this.selectedTask.set(task);
  }

  closeTask() { this.selectedTask.set(null); }

  prevMonth() {
    if (this.currentMonth() === 0) { this.currentMonth.set(11); this.currentYear.update(y => y - 1); }
    else { this.currentMonth.update(m => m - 1); }
  }

  nextMonth() {
    if (this.currentMonth() === 11) { this.currentMonth.set(0); this.currentYear.update(y => y + 1); }
    else { this.currentMonth.update(m => m + 1); }
  }

  goToToday() {
    this.currentYear.set(new Date().getFullYear());
    this.currentMonth.set(new Date().getMonth());
  }

  formatDeadline(deadline: string): string {
    if (!deadline) return 'Sans date';
    const d = new Date(deadline);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      + ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getDayClass(day: CalendarDay): string {
    if (day.isToday) return 'cal-day-today';
    if (!day.inMonth) return 'cal-day-other';
    return 'cal-day';
  }

  getChipClass(status: TaskStatus): string { return `chip-${status}`; }

  getStatusLabel(status: TaskStatus): string {
    return ({ todo: 'À faire', in_progress: 'En cours', done: 'Terminée' } as Record<string, string>)[status] || status;
  }

  getStatusBadgeClass(status: TaskStatus): string {
    const m: Record<string, string> = {
      todo: 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      in_progress: 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30',
      done: 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30',
    };
    return m[status] || '';
  }

  getHeaderBarClass(status: TaskStatus): string {
    return ({ todo: 'bg-yellow-500', in_progress: 'bg-purple-500', done: 'bg-green-500' } as Record<string, string>)[status] || 'bg-accent';
  }

  getHeaderBgClass(status: TaskStatus): string {
    return ({ todo: 'bg-[#FFEBCC]', in_progress: 'bg-[#E9D5FF]', done: 'bg-[#DCFCE7]' } as Record<string, string>)[status] || 'bg-accent/20';
  }

  getGCalUrl(task: Task): string {
    if (!task.deadline) return '#';
    const start = new Date(task.deadline);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const details = [
      `📁 Projet : ${task.project_name || ''}`,
      task.description ? `📝 ${task.description}` : '',
      '',
      '⚡ Tâche créée via ESMT Tasks — rappels activés : 1 semaine, 48h et 24h avant la deadline.'
    ].filter(Boolean).join('\n');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `📌 ${task.title}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details,
      sf: 'true',
      output: 'xml'
    });
    return 'https://calendar.google.com/calendar/r/eventnew?' + params.toString();
  }
}
