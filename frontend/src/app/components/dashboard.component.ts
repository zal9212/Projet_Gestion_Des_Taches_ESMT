import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, TaskService } from '../services/project.service';
import { AuthService } from '../services/auth.service';
import { Project, Task, TaskStatus, ProjectMember } from '../models/models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="h-full flex flex-col md:flex-row gap-8 p-6 lg:p-10 overflow-hidden font-dmsans animate-in fade-in duration-700">
      
      <!-- LEFT COLUMN: Tasks & Projects -->
      <div class="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
        
        <!-- Hero Section -->
        <div class="hero flex justify-between items-start">
          <div>
            <h1 class="font-syne text-4xl font-bold tracking-tight text-txt leading-tight">
              Mes <span class="text-accent-bright">Tâches</span>
            </h1>
            <p class="text-sm text-txt-sec mt-2 max-w-sm leading-relaxed">
              Consultez vos missions et mettez à jour votre progression.
            </p>
          </div>
          
          <div class="flex gap-3">
             <button (click)="loadData()" class="p-2.5 rounded-xl bg-white/5 border border-border-col text-txt-sec hover:text-txt transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
             </button>
             @if (hasOwnedProjects()) {
                <button (click)="showCreateTask = true" class="bg-accent hover:bg-accent-bright text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_15px_rgba(59,111,245,0.4)] transition-all flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nouvelle tâche
                </button>
             }
          </div>
        </div>

        <!-- Filters & Search -->
        <div class="flex flex-col gap-4">
            <!-- Search Bar -->
            <div class="relative w-full max-w-md">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-txt-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <input type="text" [(ngModel)]="searchQuery" (input)="filterTasks()" placeholder="Rechercher une tâche (titre, description)..." class="w-full bg-bg-card border border-border-col rounded-xl pl-10 pr-4 py-2 text-sm text-txt outline-none focus:border-accent transition-colors shadow-sm">
            </div>

            <div class="flex items-center gap-3 flex-wrap">
                <button (click)="setStatusFilter('')" [class.active-pill]="statusFilter === ''" class="pill-btn">Toutes</button>
                <div class="w-px h-6 bg-border-col mx-2 hidden sm:block"></div>
                <button (click)="setStatusFilter('todo')" [class.active-pill]="statusFilter === 'todo'" class="pill-btn flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-accent-yellow"></span> À faire
                </button>
                <button (click)="setStatusFilter('in_progress')" [class.active-pill]="statusFilter === 'in_progress'" class="pill-btn flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-accent-purple"></span> En cours
                </button>
                <button (click)="setStatusFilter('done')" [class.active-pill]="statusFilter === 'done'" class="pill-btn flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-accent-green"></span> Terminé
                </button>
                
                <div class="border-l border-border-col pl-3 flex items-center gap-2">
                    <span class="text-[10px] uppercase font-bold text-txt-muted">Filtrer par assigné :</span>
                    <select [(ngModel)]="userFilter" (change)="filterTasks()" class="bg-white/5 border border-border-col rounded-lg text-[10px] px-2 py-1 outline-none text-txt-sec cursor-pointer">
                        <option [value]="0">Tous les utilisateurs</option>
                        @for (uId of getUniqueAssignees(); track uId) {
                            <option [value]="uId">{{ getUsernameById(uId) }}</option>
                        }
                    </select>
                </div>
            </div>
        </div>

        <!-- Task List -->
        <div class="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
            @for (task of filteredTasks(); track task.id) {
                <div class="bg-bg-card border border-border-col rounded-2xl p-5 hover:border-border-lt transition-all group relative overflow-hidden">
                    <!-- Objectif 2, 4b: Visual indicator if the user is assigned -->
                    @if (task.assigned_to === auth.currentUser()?.id) {
                        <div class="absolute top-0 right-0 px-2 py-1 bg-accent/20 text-accent text-[8px] font-bold rounded-bl-lg uppercase">Ma tâche</div>
                    }

                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                            @switch (task.status) {
                                @case ('todo') { <span class="text-accent-yellow flex items-center gap-1.5"><i class="w-1.5 h-1.5 rounded-full bg-accent-yellow"></i> À faire</span> }
                                @case ('in_progress') { <span class="text-accent-purple flex items-center gap-1.5"><i class="w-1.5 h-1.5 rounded-full bg-accent-purple"></i> En cours</span> }
                                @case ('done') { <span class="text-accent-green flex items-center gap-1.5"><i class="w-1.5 h-1.5 rounded-full bg-accent-green"></i> Terminé</span> }
                            }
                            <span class="text-txt-muted px-2">•</span>
                            <span class="text-accent-bright">{{ task.project_name }}</span>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            @if (canUpdateTask(task)) {
                                <select (change)="updateStatus(task, $event)" class="bg-white/5 border border-border-col rounded-lg text-[10px] px-2 py-1 outline-none text-txt-sec cursor-pointer hover:bg-white/10 transition-colors">
                                    <option value="" disabled selected>Changer statut</option>
                                    <option value="todo">À faire</option>
                                    <option value="in_progress">En cours</option>
                                    <option value="done">Terminé</option>
                                </select>
                            }
                            @if (canDeleteTask(task)) {
                                <button (click)="deleteTask(task.id)" class="text-txt-muted hover:text-accent-red p-1.5 transition-colors" title="Supprimer la tâche">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            }
                        </div>
                    </div>

                    <h3 class="text-base font-bold text-txt mb-1">{{ task.title }}</h3>
                    <p class="text-xs text-txt-sec line-clamp-2 leading-relaxed mb-4">{{ task.description }}</p>

                    <div class="flex items-center justify-between mt-auto">
                        <div class="flex items-center gap-4 text-[11px] text-txt-muted">
                            <span class="flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                {{ task.deadline ? (task.deadline | date:'MMM dd, HH:mm') : 'Pas de date' }}
                            </span>
                        </div>

                        <div class="flex items-center gap-2">
                             <span class="text-[9px] font-bold text-txt-muted uppercase tracking-tighter">Assigné à :</span>
                             <div class="w-7 h-7 rounded-full border border-border-col bg-accent/20 flex items-center justify-center text-[9px] font-bold text-accent uppercase" [title]="task.assigned_to_username || 'Non assigné'">
                                 {{ task.assigned_to_username?.[0] || '?' }}
                             </div>
                        </div>
                    </div>
                </div>
            } @empty {
                <div class="flex flex-col items-center justify-center py-20 text-txt-muted bg-white/5 rounded-3xl border border-dashed border-border-col">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mb-4 opacity-30"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                    <p class="text-sm">Aucune tâche active</p>
                </div>
            }
        </div>
      </div>

      <!-- RIGHT COLUMN: Projects Management -->
      <aside class="w-full md:w-80 flex flex-col gap-5 overflow-y-auto pr-1">
        
        <!-- Stats summary -->
        <div class="bg-gradient-to-br from-[#1e378c]/50 to-[#0f1e50]/70 border border-accent/20 rounded-2xl p-6 shadow-xl">
            <h4 class="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-bright mb-4">Statistiques</h4>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div class="text-xl font-bold text-txt">{{ tasks().length }}</div>
                    <div class="text-[9px] text-txt-muted uppercase font-bold">Total</div>
                </div>
                <div class="bg-accent-green/10 rounded-xl p-3 border border-accent-green/20">
                    <div class="text-xl font-bold text-accent-green">{{ getDoneCount() }}</div>
                    <div class="text-[9px] text-txt-muted uppercase font-bold">Terminées</div>
                </div>
            </div>
        </div>

        <!-- Projects Header -->
        <div class="flex items-center justify-between px-2">
            <h4 class="text-xs font-bold uppercase tracking-widest text-txt">Mes Projets</h4>
            <span class="text-[10px] bg-white/10 text-txt-sec px-2 py-0.5 rounded-full">{{ projects().length }}</span>
        </div>

        <!-- Projects List -->
        <div class="flex flex-col gap-3 pb-10">
             @for (project of projects(); track project.id) {
                <div class="bg-bg-card border border-border-col rounded-2xl p-4 hover:border-border-lt transition-all">
                    <div class="flex items-center justify-between mb-2">
                         <h5 class="text-sm font-bold text-txt truncate">{{ project.name }}</h5>
                         @if (project.owner === auth.currentUser()?.id) {
                            <span class="text-[8px] bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase font-bold">Propriétaire</span>
                         }
                    </div>
                    <p class="text-[11px] text-txt-sec line-clamp-1 mb-3">{{ project.description }}</p>
                    
                    <div class="flex items-center justify-between">
                         <div class="flex items-center -space-x-1.5">
                              <div class="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[7px] font-bold text-white border border-[#0a1228]" [title]="'Propriétaire: ' + project.owner_username">{{ project.owner_username[0] }}</div>
                              @for (m of project.members; track m.id) {
                                  <div class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[7px] font-bold text-txt-sec border border-[#0a1228]" [title]="m.username">{{ m.username[0] }}</div>
                              }
                         </div>
                         @if (project.owner === auth.currentUser()?.id) {
                            <button (click)="openProjectMembers(project)" class="text-[10px] font-bold text-accent-bright hover:underline">Gérer membres</button>
                         }
                    </div>
                </div>
             }
        </div>
      </aside>

      <!-- MODAL: Create Task -->
      @if (showCreateTask) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
             <div class="bg-[#0a122d] border border-border-col rounded-[32px] w-full max-w-md p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
                  <header class="flex justify-between items-center mb-6">
                       <h2 class="font-syne font-bold text-xl text-txt">Nouvelle Tâche</h2>
                       <button (click)="showCreateTask = false" class="text-txt-muted hover:text-txt"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                  </header>

                  <form (submit)="createTask()" class="flex flex-col gap-4">
                       <div class="flex flex-col gap-1.5">
                            <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Projet</label>
                            <select [(ngModel)]="newTask.project" name="project" class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent">
                                <option [value]="0" disabled>Sélectionner un projet</option>
                                @for (p of getOwnedProjects(); track p.id) {
                                    <option [value]="p.id">{{ p.name }}</option>
                                }
                            </select>
                       </div>

                       <div class="flex flex-col gap-1.5">
                            <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Titre</label>
                            <input [(ngModel)]="newTask.title" name="title" placeholder="Ex: Finaliser le rapport..." class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent">
                       </div>

                       <div class="flex flex-col gap-1.5">
                            <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Description</label>
                            <textarea [(ngModel)]="newTask.description" name="description" rows="2" class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent resize-none"></textarea>
                       </div>

                       <div class="flex flex-col gap-1.5 font-bold">
                            <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Assigner à</label>
                            <select [(ngModel)]="newTask.assigned_to" name="assigned_to" class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent">
                                <option [value]="undefined">— Non assignée —</option>
                                @for (m of getFilteredAssignableMembers(); track m.user) {
                                    <option [value]="m.user">{{ m.full_name || m.username }}</option>
                                }
                                <!-- Inclure aussi l'owner dans les choix -->
                                @if (getSelectedProject()?.owner) {
                                     <option [value]="getSelectedProject()?.owner">{{ getSelectedProject()?.owner_username }} (Moi)</option>
                                }
                            </select>
                            <!-- Objectif 2, 3d indicator -->
                            @if (auth.currentUser()?.role === 'etudiant') {
                                <p class="text-[9px] text-accent-purple/60 italic pl-1">Règle : Vous ne pouvez pas assigner un professeur.</p>
                            }
                       </div>

                       <div class="grid grid-cols-2 gap-4">
                            <div class="flex flex-col gap-1.5">
                                <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Deadline</label>
                                <input type="datetime-local" [(ngModel)]="newTask.deadline" name="deadline" class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent [color-scheme:dark]">
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <label class="text-[10px] font-bold text-txt-muted uppercase tracking-widest pl-1">Status</label>
                                <select [(ngModel)]="newTask.status" name="status" class="w-full bg-white/5 border border-border-col rounded-xl px-4 py-3 text-sm text-txt outline-none focus:border-accent">
                                    <option value="todo">À faire</option>
                                    <option value="in_progress">En cours</option>
                                    <option value="done">Terminé</option>
                                </select>
                            </div>
                       </div>

                       <button type="submit" class="mt-2 bg-accent hover:bg-accent-bright text-white py-4 rounded-2xl font-bold text-sm shadow-xl transition-all">Créer la tâche</button>
                  </form>
             </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .pill-btn { @apply px-4 py-1.5 rounded-full bg-white/[0.07] border border-border-col text-[12px] font-medium text-txt hover:bg-white/10 transition-all; }
    .active-pill { @apply bg-accent/20 border border-accent/40 shadow-lg text-accent-bright; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 111, 245, 0.2); border-radius: 10px; }
    select option { background: #070d1e; color: #e8edf8; }
  `],
})
export class DashboardComponent implements OnInit {
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  public auth = inject(AuthService);

  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  filteredTasks = signal<Task[]>([]);

  statusFilter = '';
  userFilter = 0;
  searchQuery = '';
  showCreateTask = false;

  newTask: Partial<Task> = {
    project: 0,
    title: '',
    description: '',
    status: TaskStatus.TODO,
    deadline: '',
    assigned_to: undefined
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.projectService.getProjects().subscribe(p => this.projects.set(p));
    this.taskService.getTasks().subscribe(t => {
      this.tasks.set(t);
      this.filterTasks();
    });
  }

  setStatusFilter(status: string) {
    this.statusFilter = status;
    this.filterTasks();
  }

  filterTasks() {
    let filtered = this.tasks();
    if (this.statusFilter) {
      filtered = filtered.filter(t => t.status === this.statusFilter);
    }
    if (this.userFilter && this.userFilter > 0) {
      filtered = filtered.filter(t => t.assigned_to === Number(this.userFilter));
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    this.filteredTasks.set(filtered);
  }

  getUniqueAssignees() {
    const ids = this.tasks().map(t => t.assigned_to).filter(id => !!id) as number[];
    return [...new Set(ids)];
  }

  getUsernameById(id: number) {
    const task = this.tasks().find(t => t.assigned_to === id);
    return task?.assigned_to_username || `Utilisateur ${id}`;
  }

  getDoneCount() {
    return this.tasks().filter(t => t.status === 'done').length;
  }

  getOwnedProjects() {
    return this.projects().filter(p => p.owner === this.auth.currentUser()?.id);
  }

  hasOwnedProjects() {
    return this.getOwnedProjects().length > 0;
  }

  getSelectedProject(): Project | undefined {
    return this.projects().find(p => p.id === Number(this.newTask.project));
  }

  getFilteredAssignableMembers(): ProjectMember[] {
    const proj = this.getSelectedProject();
    if (!proj || !proj.members) return [];

    const currentUser = this.auth.currentUser();
    // 3d. Les étudiants ne peuvent pas associer un professeur à une tache
    if (currentUser?.role === 'etudiant') {
      return proj.members.filter(m => m.role !== 'professeur');
    }
    return proj.members;
  }

  createTask() {
    if (!this.newTask.project || !this.newTask.title) {
      alert("Projet et titre requis !");
      return;
    }
    this.taskService.createTask(this.newTask).subscribe({
      next: () => {
        this.showCreateTask = false;
        this.newTask = { project: 0, title: '', description: '', status: TaskStatus.TODO };
        this.loadData();
      },
      error: (err) => alert("Erreur: " + (err.error?.detail || JSON.stringify(err.error)))
    });
  }

  deleteTask(id: number) {
    if (confirm("Supprimer cette tâche ?")) {
      this.taskService.deleteTask(id).subscribe(() => this.loadData());
    }
  }

  updateStatus(task: Task, event: any) {
    const newStatus = event.target.value as TaskStatus;
    this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
      next: () => this.loadData(),
      error: (err) => alert("Erreur: " + (err.error?.detail || err.message))
    });
  }

  canUpdateTask(task: Task): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    // 4b. Les utilisateurs assignés peuvent uniquement modifier les tâches qui leur sont attribuées OU owner
    return task.assigned_to === user.id || this.projects().some(p => p.id === task.project && p.owner === user.id);
  }

  canDeleteTask(task: Task): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    // 4a. Seuls les créateurs d’un projet peuvent supprimer des tâches
    return this.projects().some(p => p.id === task.project && p.owner === user.id);
  }

  openProjectMembers(project: Project) {
    const username = prompt("Entrez le nom d'utilisateur à ajouter au projet '" + project.name + "' :");
    if (username) {
      alert("L'ajout via nom d'utilisateur nécessite un endpoint de recherche. Veuillez utiliser l'interface Django pour gérer les membres complexes, ou l'ID si connu.");
      // Alternative logic can be added here if we had a userService.getUserIdByUsername
    }
  }
}
