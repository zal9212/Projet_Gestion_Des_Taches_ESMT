import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard.component';
import { ProfileComponent } from './components/profile.component';
import { StatsComponent } from './components/stats.component';
import { CalendarComponent } from './components/calendar.component';
import { ChatComponent } from './components/chat.component';
import { AssistantComponent } from './components/assistant.component';

export const routes: Routes = [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'analytics', component: StatsComponent },
    { path: 'assistant', component: AssistantComponent },
    { path: 'messages', redirectTo: 'chat', pathMatch: 'full' },
    { path: 'calendar', component: CalendarComponent },
    { path: 'chat', component: ChatComponent },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: 'dashboard' }
];


