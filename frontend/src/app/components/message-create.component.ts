import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from '../services/message.service';
import { UserMinimal } from '../models/models';

@Component({
    selector: 'app-message-create',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="h-full flex flex-col gap-6 p-6 lg:p-10 max-w-2xl font-dmsans">
        <a routerLink="/messages" class="text-xs text-txt-sec hover:text-txt flex items-center gap-1">
            ← Retour aux messages
        </a>

        <h1 class="font-syne text-2xl font-bold text-txt">Nouveau message</h1>

        <form (ngSubmit)="send()" class="flex flex-col gap-4 bg-bg-card border border-border-col rounded-2xl p-6">
            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Destinataire</label>
                <select [(ngModel)]="recipient" name="recipient" required
                    class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent">
                    <option [value]="0" disabled>Sélectionner un destinataire</option>
                    @for (u of users(); track u.id) {
                        <option [value]="u.id">{{ u.full_name || u.username }}</option>
                    }
                </select>
            </div>

            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Sujet</label>
                <input [(ngModel)]="subject" name="subject" placeholder="Sujet du message"
                    class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent">
            </div>

            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Message</label>
                <textarea [(ngModel)]="body" name="body" rows="5" required placeholder="Votre message..."
                    class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent resize-none"></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-2">
                <button type="button" routerLink="/messages" class="px-4 py-2 rounded-xl border border-border-col text-txt-sec hover:bg-white/5 transition-all">
                    Annuler
                </button>
                <button type="submit" [disabled]="sending()" class="px-5 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-bright transition-all disabled:opacity-50">
                    {{ sending() ? 'Envoi...' : 'Envoyer' }}
                </button>
            </div>
        </form>
    </div>
    `,
    styles: [`select option { background: #070d1e; color: #e8edf8; }`]
})
export class MessageCreateComponent {
    private msgService = inject(MessageService);
    private router = inject(Router);

    users = signal<UserMinimal[]>([]);
    recipient = 0;
    subject = '';
    body = '';
    sending = signal(false);

    constructor() {
        this.msgService.getUsers().subscribe(u => this.users.set(u));
    }

    send() {
        const recipientId = Number(this.recipient);
        if (!recipientId || !this.body?.trim()) {
            alert('Destinataire et message requis.');
            return;
        }
        this.sending.set(true);
        this.msgService.createMessage({
            recipient: recipientId,
            subject: this.subject?.trim() || '',
            body: this.body.trim()
        }).subscribe({
            next: () => this.router.navigate(['/messages']),
            error: (err) => {
                this.sending.set(false);
                const msg = err.error?.detail || err.error?.recipient?.[0] || err.error?.body?.[0] || JSON.stringify(err.error) || err.message || 'Erreur lors de l\'envoi.';
                alert(msg);
            }
        });
    }
}
