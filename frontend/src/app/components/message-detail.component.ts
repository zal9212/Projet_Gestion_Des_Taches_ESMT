import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MessageService } from '../services/message.service';
import { Message } from '../models/models';

@Component({
    selector: 'app-message-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="h-full flex flex-col gap-6 p-6 lg:p-10 max-w-2xl font-dmsans">
        <a routerLink="/messages" class="text-xs text-txt-sec hover:text-txt flex items-center gap-1">
            ← Retour aux messages
        </a>

        @if (message()?.id) {
            <div class="bg-bg-card border border-border-col rounded-2xl p-6 space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-[10px] text-txt-muted uppercase font-bold">De</p>
                        <p class="text-sm text-txt font-semibold">{{ message()!.sender_full_name || message()!.sender_username }}</p>
                    </div>
                    <span class="text-[10px] text-txt-muted">{{ message()!.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>

                <div class="pt-2 border-t border-white/10">
                    <p class="text-[10px] text-txt-muted uppercase font-bold">À</p>
                    <p class="text-sm text-txt font-semibold">{{ message()!.recipient_full_name || message()!.recipient_username }}</p>
                </div>

                @if (message()!.subject) {
                    <div class="pt-2 border-t border-white/10">
                        <p class="text-[10px] text-txt-muted uppercase font-bold">Sujet</p>
                        <p class="text-sm text-accent-bright font-semibold">{{ message()!.subject }}</p>
                    </div>
                }

                <div class="pt-2 border-t border-white/10">
                    <p class="text-[10px] text-txt-muted uppercase font-bold mb-2">Message</p>
                    <p class="text-sm text-txt whitespace-pre-line leading-relaxed">{{ message()!.body }}</p>
                </div>
            </div>
        } @else {
            <div class="text-txt-muted">Chargement...</div>
        }
    </div>
    `,
})
export class MessageDetailComponent implements OnInit {
    private msgService = inject(MessageService);
    private route = inject(ActivatedRoute);

    message = signal<Message | null>(null);

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.msgService.getMessage(id).subscribe(m => this.message.set(m));
    }
}
