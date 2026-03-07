import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard.component';
import { ProfileComponent } from './components/profile.component';
import { StatsComponent } from './components/stats.component';
import { MessagesComponent } from './components/messages.component';
import { MessageCreateComponent } from './components/message-create.component';
import { MessageDetailComponent } from './components/message-detail.component';

export const routes: Routes = [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'analytics', component: StatsComponent },
    { path: 'messages', component: MessagesComponent },
    { path: 'messages/new', component: MessageCreateComponent },
    { path: 'messages/:id', component: MessageDetailComponent },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: 'dashboard' }
];
