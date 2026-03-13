import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { Notification } from '../models/models';

@Component({
    selector: 'app-notification-bell',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="relative">
        <button (click)="open = !open" class="icon-btn relative"
            style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(200,215,240,0.6); cursor: pointer;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            @if (notifService.unreadCount() > 0) {
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center">
                    {{ notifService.unreadCount() }}
                </span>
            }
        </button>

        @if (open) {
            <div class="absolute right-0 mt-2 w-80 rounded-2xl border border-border-col shadow-xl z-50 overflow-hidden"
                style="background: rgba(255,255,255,0.05);">
                <div class="px-4 py-3 flex items-center justify-between" style="border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <span class="text-xs font-semibold text-txt">Notifications</span>
                    <span class="text-[10px] text-txt-muted">{{ notifService.unreadCount() }} non lues</span>
                </div>
                <div class="max-h-64 overflow-y-auto">
                    @for (n of notifService.notifications(); track n.id) {
                        <div class="px-4 py-3 text-xs border-b border-border-col" [class.bg-accent/5]="!n.is_read">
                            <p class="text-[11px] text-txt mb-1">{{ n.message }}</p>
                            <p class="text-[10px] text-txt-muted">{{ n.created_at | date:'dd/MM HH:mm' }}</p>
                        </div>
                    } @empty {
                        <p class="px-4 py-3 text-[11px] text-txt-muted italic">Aucune notification.</p>
                    }
                </div>
            </div>
        }
    </div>
    `,
})
export class NotificationBellComponent implements OnInit {
    notifService = inject(NotificationService);
    open = false;

    ngOnInit() {
        this.notifService.getNotifications().subscribe();
    }
}
