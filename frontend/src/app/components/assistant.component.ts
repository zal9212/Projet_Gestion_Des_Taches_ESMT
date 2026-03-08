import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, AssistantMessage } from '../services/assistant.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex items-center justify-center p-4 lg:p-8 font-dmsans">
      <div class="w-full max-w-2xl h-full max-h-[520px] bg-[#070d1f]/95 border border-border-col rounded-[28px] shadow-2xl flex flex-col overflow-hidden">
        
        <header class="px-5 py-4 border-b border-border-col bg-white/5 flex items-center justify-between">
          <div>
            <h1 class="font-syne text-lg font-bold text-white">Assistant IA</h1>
            <p class="text-[11px] text-txt-sec">
              Pose des questions sur tes tâches, projets, primes ou le fonctionnement de la plateforme.
            </p>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
          <div *ngFor="let m of messages" [ngClass]="m.role === 'user' ? 'justify-end' : 'justify-start'" class="flex">
            <div
              [ngClass]="m.role === 'user'
                ? 'bg-accent px-4 py-2.5 rounded-2xl rounded-br-sm text-xs text-white max-w-[80%]'
                : 'bg-white/5 border border-border-col px-4 py-2.5 rounded-2xl rounded-bl-sm text-xs text-txt max-w-[80%]'">
              {{ m.content }}
            </div>
          </div>

          <div *ngIf="loading" class="flex justify-start">
            <div class="bg-white/5 border border-border-col px-4 py-2.5 rounded-2xl rounded-bl-sm text-xs text-txt flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              L'assistant réfléchit...
            </div>
          </div>

          <div *ngIf="messages.length === 0 && !loading" class="text-center text-[12px] text-txt-muted mt-6">
            Exemple : « Quelles sont mes tâches en retard ? », « Pourquoi je n'ai pas de prime cette année ? »,
            « Rappelle-moi les règles pour les étudiants et professeurs ».
          </div>
        </main>

        <form class="p-3 border-t border-border-col flex items-center gap-3 bg-[#050a1a]" (ngSubmit)="send()">
          <input
            type="text"
            [(ngModel)]="input"
            name="message"
            autocomplete="off"
            class="flex-1 bg-white/5 border border-border-col rounded-2xl px-4 py-2.5 text-sm text-txt outline-none focus:border-accent"
            placeholder="Écris ta question ici..."
          />
          <button
            type="submit"
            [disabled]="loading || !input.trim()"
            class="px-4 py-2.5 rounded-2xl bg-accent text-white text-xs font-bold disabled:opacity-40">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 111, 245, 0.3); border-radius: 10px; }
  `],
})
export class AssistantComponent {
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

