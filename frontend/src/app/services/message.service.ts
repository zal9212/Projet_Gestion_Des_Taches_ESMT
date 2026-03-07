import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message, UserMinimal } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private apiUrl = '/api/messages';

    constructor(private http: HttpClient) { }

    getInbox(): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.apiUrl}/inbox/`);
    }

    getSent(): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.apiUrl}/sent/`);
    }

    getAll(): Observable<Message[]> {
        return this.http.get<Message[]>(`${this.apiUrl}/`);
    }

    getMessage(id: number): Observable<Message> {
        return this.http.get<Message>(`${this.apiUrl}/${id}/`);
    }

    createMessage(data: { recipient: number; subject?: string; body: string }): Observable<Message> {
        return this.http.post<Message>(`${this.apiUrl}/`, data);
    }

    getUsers(): Observable<UserMinimal[]> {
        return this.http.get<UserMinimal[]>(`${this.apiUrl}/users/`);
    }
}
