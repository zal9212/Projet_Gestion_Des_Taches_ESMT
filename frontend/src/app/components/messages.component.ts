import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from '../services/message.service';
import { AuthService } from '../services/auth.service';
import { Message } from '../models/models';

@Component({
    selector: 'app-messages',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="h-full flex flex-col gap-6 p-6 lg:p-10 overflow-hidden font-dmsans">
        <div class="flex items-center justify-between">
            <h1 class="font-syne text-2xl font-bold text-txt">Messages</h1>
            <a routerLink="/messages/new" class="bg-accent hover:bg-accent-bright text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_15px_rgba(59,111,245,0.4)] transition-all flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nouveau message
            </a>
        </div>

        <div class="flex gap-3">
            <button (click)="tab = 'inbox'" [class.active-pill]="tab === 'inbox'" class="pill-btn">
                Boîte de réception ({{ inbox().length }})
            </button>
            <button (click)="tab = 'sent'" [class.active-pill]="tab === 'sent'" class="pill-btn">
                Envoyés ({{ sent().length }})
            </button>
        </div>

        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            @if (tab === 'inbox') {
                @for (msg of inbox(); track msg.id) {
                    <a [routerLink]="['/messages', msg.id]" class="block mb-3 p-4 bg-bg-card border rounded-2xl hover:border-accent/50 transition-all"
                        [class.border-accent/30]="!msg.is_read">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-bold text-txt">{{ msg.sender_full_name || msg.sender_username }}</span>
                            <span class="text-[10px] text-txt-muted">{{ msg.created_at | date:'dd/MM HH:mm' }}</span>
                        </div>
                        @if (msg.subject) {
                            <p class="text-xs text-accent-bright font-semibold mb-1">{{ msg.subject }}</p>
                        }
                        <p class="text-xs text-txt-sec line-clamp-2">{{ msg.body }}</p>
                    </a>
                } @empty {
                    <div class="py-20 text-center text-txt-muted border border-dashed border-border-col rounded-3xl">
                        Aucun message reçu.
                    </div>
                }
            } @else {
                @for (msg of sent(); track msg.id) {
                    <a [routerLink]="['/messages', msg.id]" class="block mb-3 p-4 bg-bg-card border border-border-col rounded-2xl hover:border-accent/50 transition-all">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-bold text-txt">À {{ msg.recipient_full_name || msg.recipient_username }}</span>
                            <span class="text-[10px] text-txt-muted">{{ msg.created_at | date:'dd/MM HH:mm' }}</span>
                        </div>
                        @if (msg.subject) {
                            <p class="text-xs text-accent-bright font-semibold mb-1">{{ msg.subject }}</p>
                        }
                        <p class="text-xs text-txt-sec line-clamp-2">{{ msg.body }}</p>
                    </a>
                } @empty {
                    <div class="py-20 text-center text-txt-muted border border-dashed border-border-col rounded-3xl">
                        Aucun message envoyé.
                    </div>
                }
            }
        </div>
    </div>
    `,
    styles: [`
        .pill-btn { @apply px-4 py-1.5 rounded-full bg-white/[0.07] border border-border-col text-[12px] font-medium text-txt hover:bg-white/10 transition-all; }
        .active-pill { @apply bg-accent/20 border border-accent/40 shadow-lg text-accent-bright; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 111, 245, 0.2); border-radius: 10px; }
    `]
})
export class MessagesComponent implements OnInit {
    private msgService = inject(MessageService);

    tab = 'inbox';
    inbox = signal<Message[]>([]);
    sent = signal<Message[]>([]);

    ngOnInit() {
        this.load();
    }

    load() {
        this.msgService.getInbox().subscribe(m => this.inbox.set(m));
        this.msgService.getSent().subscribe(m => this.sent.set(m));
    }
}
