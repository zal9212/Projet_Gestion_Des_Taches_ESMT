import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stats, Prime, Notification } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class StatsService {
    private http = inject(HttpClient);
    private apiUrl = '/api';

    getStats(): Observable<Stats[]> {
        return this.http.get<Stats[]>(`${this.apiUrl}/stats/`);
    }

    generateStats(): Observable<any> {
        return this.http.post(`${this.apiUrl}/stats/generate/`, {});
    }

    getPrimes(): Observable<Prime[]> {
        return this.http.get<Prime[]>(`${this.apiUrl}/primes/`);
    }

    getNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.apiUrl}/notifications/`);
    }

    markAsRead(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/notifications/${id}/mark_as_read/`, {});
    }
}
