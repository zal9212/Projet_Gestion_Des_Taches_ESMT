import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Notification } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = '/api/notifications';

    unreadCount = signal<number>(0);
    notifications = signal<Notification[]>([]);

    constructor(private http: HttpClient) { }

    getNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.apiUrl}/`).pipe(
            tap(list => {
                this.notifications.set(list);
                this.unreadCount.set(list.filter(n => !n.is_read).length);
            })
        );
    }

    markAsRead(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/mark_as_read/`, {}).pipe(
            tap(() => this.refreshCount())
        );
    }

    refreshCount(): void {
        this.getNotifications().subscribe();
    }
}
