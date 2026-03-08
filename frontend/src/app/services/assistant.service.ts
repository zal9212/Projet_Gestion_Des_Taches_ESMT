import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private apiUrl = '/api/assistant/';

  constructor(private http: HttpClient) {}

  sendMessage(message: string, history: AssistantMessage[]): Observable<{ answer: string }> {
    return this.http.post<{ answer: string }>(this.apiUrl, { message, history });
  }
}

