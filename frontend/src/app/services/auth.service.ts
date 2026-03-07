import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of, map, Observable } from 'rxjs';
import { User } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api';
    private accountsUrl = '/accounts/api';

    public currentUser = signal<User | null>(null);
    public isAuthenticated = signal<boolean>(false);

    constructor(private http: HttpClient, private router: Router) {
        this.checkInitialAuth();
    }

    private checkInitialAuth() {
        // Try getting token via Django session
        this.http.get<any>(`${this.accountsUrl}/session-token/`, { withCredentials: true }).subscribe({
            next: (res) => {
                localStorage.setItem('access_token', res.access);
                localStorage.setItem('refresh_token', res.refresh);
                this.loadUser();
            },
            error: () => {
                const token = localStorage.getItem('access_token');
                if (token) {
                    this.loadUser();
                } else {
                    window.location.href = '/accounts/login/';
                }
            }
        });
    }

    private loadUser() {
        this.getMe().subscribe({
            next: (user) => {
                this.currentUser.set(user);
                this.isAuthenticated.set(true);
                // Force redirection if already logged in but on login/register page
                const path = window.location.pathname;
                if (path.endsWith('/login') || path.endsWith('/register') || path === '/portal/' || path === '/portal') {
                    this.router.navigate(['/dashboard']);
                }
            },
            error: () => this.logout()
        });
    }

    // login/register handled by Django now

    getMe(): Observable<User> {
        return this.http.get<User>(`${this.accountsUrl}/me/`);
    }

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
    }
}
