import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, AssistantMessage } from '../services/assistant.service';

@Component({
  selector: 'app-assistant-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Bouton flottant -->
    <button
      *ngIf="!open()"
      (click)="open.set(true)"
      class="fixed bottom-6 right-6 z-[120] w-12 h-12 rounded-full bg-accent shadow-lg shadow-accent/40 flex items-center justify-center text-white hover:bg-accent-bright transition-all"
      title="Assistant IA"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <!-- Panel flottant -->
    <div
      *ngIf="open()"
      class="fixed bottom-4 right-4 z-[120] w-[320px] max-w-[90vw] h-[420px] bg-[#070d1f]/95 border border-border-col rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <header class="shrink-0 px-4 py-3 border-b flex items-center justify-between gap-3" style="border-color: rgba(255,255,255,0.1); background: rgba(15,25,50,0.6);">
        <div class="min-w-0 flex-1">
          <h2 class="m-0 text-base font-bold leading-tight" style="font-family: 'Syne', sans-serif; color: #ffffff;">
            Assistant IA
          </h2>
          <p class="m-0 mt-1 text-[11px] leading-tight" style="color: rgba(200,215,240,0.75);">
            Questions sur tes tâches, projets, primes...
          </p>
        </div>
        <button type="button" (click)="open.set(false)"
          class="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-base font-medium transition-colors hover:bg-white/15"
          style="color: #ffffff; background: rgba(255,255,255,0.06);"
          title="Fermer"
          aria-label="Fermer l'assistant">
          ✕
        </button>
      </header>

      <main class="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2 custom-scrollbar" style="background: rgba(5, 10, 26, 0.5);">
        <div *ngFor="let m of messages" [ngClass]="m.role === 'user' ? 'justify-end' : 'justify-start'" class="flex">
          <div
            [ngClass]="m.role === 'user'
              ? 'bg-accent px-3 py-2 rounded-2xl rounded-br-sm text-[11px] text-white max-w-[80%]'
              : 'bg-white/5 border border-border-col px-3 py-2 rounded-2xl rounded-bl-sm text-[11px] text-txt max-w-[80%]'">
            {{ m.content }}
          </div>
        </div>

        <div *ngIf="loading" class="flex justify-start">
          <div class="bg-white/5 border border-border-col px-3 py-2 rounded-2xl rounded-bl-sm text-[11px] text-txt flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            L'assistant réfléchit...
          </div>
        </div>

        <div *ngIf="messages.length === 0 && !loading" class="text-center text-[11px] mt-4 px-2" style="color: rgba(200, 215, 240, 0.5);">
          Exemples : « Tâches en retard ? », « Pourquoi pas de prime ? »
        </div>
      </main>

      <form class="p-2 border-t border-border-col flex items-center gap-2 bg-[#050a1a]" (ngSubmit)="send()">
        <input
          type="text"
          [(ngModel)]="input"
          name="message"
          autocomplete="off"
          class="flex-1 bg-white/5 border border-border-col rounded-xl px-3 py-1.5 text-[11px] text-txt outline-none focus:border-accent"
          placeholder="Pose ta question..."
        />
        <button
          type="submit"
          [disabled]="loading || !input.trim()"
          class="px-3 py-1.5 rounded-xl bg-accent text-white text-[10px] font-bold disabled:opacity-40"
        >
          Env.
        </button>
      </form>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 111, 245, 0.3); border-radius: 8px; }
  `],
})
export class AssistantWidgetComponent {
  open = signal(false);
  messages: AssistantMessage[] = [];
  input = '';
  loading = false;

  constructor(private assistant: AssistantService) {}

  send() {
    const text = this.input.trim();
    if (!text || this.loading) {
      return;
    }

    this.messages.push({ role: 'user', content: text });
    this.input = '';
    this.loading = true;

    this.assistant.sendMessage(text, this.messages).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.answer });
        this.loading = false;
      },
      error: (err) => {
        const detail = err?.error?.detail || "Une erreur est survenue côté serveur.";
        this.messages.push({
          role: 'assistant',
          content: `Je ne peux pas répondre pour le moment : ${detail}`,
        });
        this.loading = false;
      },
    });
  }
}

