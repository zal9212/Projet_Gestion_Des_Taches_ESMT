import { Component, OnInit, OnDestroy, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface Message {
  id?: number;
  sender?: number;
  sender_username: string;
  content: string;
  timestamp: string;
  file?: string;
  file_name?: string;
  file_type?: string;
  isMe?: boolean;
}

interface Conversation {
  id: number;
  participants: User[];
  name?: string;
  last_message?: Message;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
      <div class="chat-wrapper w-full h-full flex gap-0 p-0 font-dmsans overflow-hidden bg-bg-deep/50 backdrop-blur-3xl lg:rounded-[32px] border border-white/5">
      
      <!-- List Section (Contacts & Conversations) -->
      <div class="flex flex-col border-r border-white/5 bg-white/5 transition-all duration-300 overflow-hidden flex-shrink-0"
           [class.w-full]="!selectedConv()" [class.lg:w-96]="true"
           [class.max-lg:hidden]="selectedConv()"
           [class.lg:hidden]="!sidebarVisible()">
        
        <div class="p-6 border-b border-white/5">
          <div class="flex items-center justify-between mb-4">
            <h1 class="font-syne text-2xl font-bold text-white">Messages</h1>
            <button (click)="showAddModal.set(true)" class="p-2 rounded-xl bg-accent/20 text-accent-bright hover:bg-accent/40 transition-all" title="Ajouter un contact">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          
          <!-- Search/Add User -->
          <div class="relative">
            <input type="text" [(ngModel)]="searchQuery" (input)="searchUsers()"
                   placeholder="Rechercher ou ajouter un contact..."
                   class="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-11 text-sm text-white focus:border-accent-bright outline-none transition-all">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-txt-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            
            <!-- Search Results Dropdown -->
            @if (searchResults().length > 0) {
              <div class="absolute top-full left-0 right-0 mt-2 bg-[#0d1530] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                @for (user of searchResults(); track user.id) {
                  <button (click)="startConv(user)" class="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left transition-colors">
                    <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white italic uppercase">{{ user.username[0] }}</div>
                    <div>
                      <p class="text-sm font-bold text-white">{{ user.username }}</p>
                      <p class="text-[10px] text-txt-muted">{{ user.first_name }} {{ user.last_name }}</p>
                    </div>
                    <svg class="ml-auto text-accent-bright" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7v14"/></svg>
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-white/5">
          <button (click)="tab.set('recents')" [class.border-accent-bright]="tab() === 'recents'" class="flex-1 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all" [class.text-white]="tab() === 'recents'" [class.text-txt-muted]="tab() !== 'recents'">Récents</button>
          <button (click)="tab.set('contacts')" [class.border-accent-bright]="tab() === 'contacts'" class="flex-1 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all" [class.text-white]="tab() === 'contacts'" [class.text-txt-muted]="tab() !== 'contacts'">Contacts</button>
        </div>

        <!-- Conversations List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          @if (tab() === 'recents') {
            @for (conv of conversations(); track conv.id) {
              <button (click)="selectConv(conv)" [class.bg-white/5]="selectedConv()?.id === conv.id" class="w-full max-w-full overflow-hidden flex items-center gap-4 p-4 hover:bg-white/5 text-left border-b border-white/5 transition-colors group">
                <div class="relative flex-shrink-0">
                  <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center font-bold text-white uppercase italic text-lg border border-white/10">{{ getOtherUser(conv).username[0] }}</div>
                  <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-bg-deep bg-green-500"></span>
                </div>
                <div class="flex-1 min-w-0 overflow-hidden">
                  <div class="flex items-center justify-between mb-0.5">
                    <p class="text-sm font-bold text-white truncate">{{ getOtherUser(conv).username }}</p>
                    <span class="text-[9px] text-txt-muted flex-shrink-0 ml-2">{{ conv.last_message?.timestamp || '' }}</span>
                  </div>
                  <p class="text-[11px] text-txt-muted truncate group-hover:text-txt-sec transition-colors inline-block w-full">{{ conv.last_message?.content || 'Aucun message' }}</p>
                </div>
              </button>
            } @empty {
              <div class="py-20 text-center opacity-30 px-10">
                <svg class="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <p class="text-xs font-bold uppercase tracking-tighter">Pas de conversations encore</p>
              </div>
            }
          } @else {
             @for (c of contacts(); track c.id) {
              <button (click)="startConv(c.contact_details!)" class="w-full max-w-full overflow-hidden flex items-center gap-4 p-4 hover:bg-white/5 text-left border-b border-white/5 transition-colors group">
                <div class="w-12 h-12 flex-shrink-0 rounded-2xl bg-white/5 flex items-center justify-center font-bold text-white uppercase italic text-lg border border-white/10">{{ c.contact_details?.username?.[0] }}</div>
                <div class="flex-1 min-w-0 overflow-hidden">
                   <p class="text-sm font-bold text-white truncate">{{ c.contact_details?.username }}</p>
                   <p class="text-[10px] text-txt-muted italic truncate inline-block w-full">{{ c.contact_details?.role }}</p>
                </div>
              </button>
             } @empty {
              <div class="py-20 text-center opacity-30 px-10">
                <p class="text-xs font-bold uppercase tracking-tighter">Votre liste de contacts est vide</p>
              </div>
             }
          }
        </div>
      </div>

      <!-- Chat Main Area -->
      <div class="flex-1 flex flex-col min-w-0 relative" [class.max-lg:hidden]="!selectedConv()">
        @if (selectedConv()) {
          <div class="p-4 lg:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div class="flex items-center gap-4">
              <button (click)="selectedConv.set(null)" class="lg:hidden p-2 -ml-2 text-txt-muted hover:text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button (click)="sidebarVisible.set(!sidebarVisible())" class="hidden lg:flex p-2 -ml-2 text-txt-muted hover:text-white transition-transform" [class.rotate-180]="!sidebarVisible()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
              </button>
              <div class="w-10 h-10 rounded-xl bg-accent-bright flex items-center justify-center font-bold text-white font-syne">{{ getOtherUser(selectedConv()!).username[0] }}</div>
              <div>
                <h2 class="font-bold text-white text-sm lg:text-base">{{ getOtherUser(selectedConv()!).username }}</h2>
                <span class="text-[10px] text-green-500 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> En ligne</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              @if (selectionMode()) {
                 <button (click)="cancelSelection()" class="px-4 py-2 rounded-xl bg-white/10 text-white text-[11px] font-bold hover:bg-white/20 transition-all uppercase tracking-widest">Annuler</button>
              }
              <button (click)="startCall(false)" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-txt-muted hover:text-white transition-all" title="Appel Audio">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              </button>
              <button (click)="startCall(true)" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-txt-muted hover:text-white transition-all" title="Appel Vidéo">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div #scrollContainer class="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-white/[0.01]">
            @for (msg of messages(); track msg.id) {
              <div [class]="msg.sender_username === currentUser()?.username ? 'flex justify-end' : 'flex justify-start'"
                   class="group/msg relative">
                
                @if (selectionMode()) {
                   <div class="flex items-center self-center px-4">
                      <input type="checkbox" [checked]="isMessageSelected(msg.id)" (change)="toggleSelection(msg.id)"
                             class="w-5 h-5 rounded-full border-2 border-white/20 bg-transparent checked:bg-accent checked:border-accent appearance-none cursor-pointer transition-all">
                   </div>
                }

                <div class="max-w-[80%] flex flex-col" [class.items-end]="msg.sender_username === currentUser()?.username"
                     (contextmenu)="$event.preventDefault(); enterSelectionMode(msg.id)"
                     (click)="selectionMode() ? toggleSelection(msg.id) : null">
                  
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[9px] font-bold text-txt-muted uppercase tracking-tighter">{{ msg.sender_username }}</span>
                    <span class="text-[9px] text-txt-muted/50">{{ msg.timestamp }}</span>
                    
                    @if (!selectionMode()) {
                      <button (click)="enterSelectionMode(msg.id)" class="opacity-0 group-hover/msg:opacity-100 p-1 text-txt-muted hover:text-white transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                      </button>
                    }
                  </div>
                  
                  <div [class]="msg.sender_username === currentUser()?.username 
                    ? 'bg-accent p-3 lg:p-4 rounded-2xl rounded-tr-none shadow-lg' 
                    : 'bg-white/5 border border-white/10 p-3 lg:p-4 rounded-2xl rounded-tl-none shadow-lg text-white'"
                    [class.ring-2]="isMessageSelected(msg.id)" [class.ring-accent-bright]="isMessageSelected(msg.id)">
                    
                    @if (msg.file) {
                      <div class="mb-2 rounded-lg overflow-hidden border border-white/20 bg-black/20">
                        @if (msg.file_type === 'image') {
                          <img [src]="msg.file" class="max-w-full h-auto max-h-60 object-cover cursor-pointer hover:scale-105 transition-transform">
                        } @else {
                          <a [href]="msg.file" target="_blank" class="p-3 flex items-center gap-3 text-white text-xs hover:bg-white/10">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span class="truncate">{{ msg.file_name }}</span>
                          </a>
                        }
                      </div>
                    }

                    @if (msg.content) {
                      <p class="text-xs lg:text-sm leading-relaxed whitespace-pre-wrap break-all overflow-hidden" [class.text-white]="msg.sender_username === currentUser()?.username">{{ msg.content }}</p>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Input Area / Selection Actions -->
          <div class="p-4 bg-white/[0.03] border-t border-white/5">
             @if (selectionMode()) {
               <div class="flex items-center justify-between p-2">
                 <div class="flex items-center gap-4">
                    <span class="text-xs font-bold text-accent-bright uppercase tracking-widest">{{ selectedIds().size }} messages sélectionnés</span>
                 </div>
                 <div class="flex items-center gap-3">
                   <button (click)="showTransferModal.set(true)" class="flex items-center gap-2 px-5 py-3 rounded-2xl bg-accent text-white text-xs font-bold hover:bg-accent-bright transition-all shadow-lg shadow-accent/20">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                     Transférer
                   </button>
                   <button (click)="deleteSelected()" class="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all border border-red-500/20">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                     Supprimer
                   </button>
                 </div>
               </div>
             } @else {
               @if (selectedFile) {
                 <div class="flex items-center gap-2 mb-3 p-2 bg-accent/20 rounded-xl border border-accent/40 w-fit">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                   <span class="text-[10px] text-white font-bold">{{ selectedFile.name }}</span>
                   <button (click)="selectedFile = null" class="p-1 hover:text-red-400">✕</button>
                 </div>
               }
  
              <form (submit)="sendMessage()" class="flex items-center gap-3">
                <input #fileInput type="file" (change)="onFileSelected($event)" class="hidden">
                <button type="button" (click)="fileInput.click()" class="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-txt-muted transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                </button>
                
                <input type="text" [(ngModel)]="newMessage" name="newMessage"
                       placeholder="Message..."
                       class="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-sm text-white focus:border-accent-bright outline-none transition-all"
                       autocomplete="off">
                
                <button type="submit" [disabled]="!newMessage.trim() && !selectedFile"
                        class="w-12 h-12 flex items-center justify-center rounded-2xl bg-accent hover:bg-accent-bright text-white shadow-lg shadow-accent/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </form>
             }
          </div>
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-20">
            <div class="w-32 h-32 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center mb-8 relative">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              @if (!sidebarVisible()) {
                <button (click)="sidebarVisible.set(true)" class="absolute -left-16 p-3 bg-accent rounded-full text-white shadow-xl hover:scale-110 transition-all animate-bounce">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
                </button>
              }
            </div>
            <h2 class="font-syne text-2xl font-bold text-white mb-2">ESMT chat Connect</h2>
            <p class="text-sm max-w-xs mx-auto">Communiquez en privé avec vos contacts, partagez des fichiers et collaborez en temps réel.</p>
          </div>
        }
      </div>

    </div>

    <!-- ADD CONTACT MODAL -->
    @if (showAddModal()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-md" (click)="showAddModal.set(false)"></div>
        <div class="relative w-full max-w-2xl bg-[#0a122d] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
          <div class="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 class="font-syne text-xl font-bold text-white">Ajouter un Membre de l'ESMT</h2>
            <button (click)="showAddModal.set(false)" class="text-txt-muted hover:text-white transition-colors">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
            @for (m of memberList(); track m.id) {
              <div class="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all mb-2 border border-white/5">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center font-bold text-white uppercase italic text-lg border border-white/10">{{ m.username[0] }}</div>
                  <div>
                    <p class="text-sm font-bold text-white">{{ m.username }}</p>
                    <p class="text-[10px] text-txt-muted uppercase tracking-widest">{{ m.first_name }} {{ m.last_name }} • {{ m.role }}</p>
                  </div>
                </div>
                <button (click)="startConv(m); showAddModal.set(false)" class="bg-accent hover:bg-accent-bright text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-accent/20">Contacter</button>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- TRANSFER MODAL -->
    @if (showTransferModal()) {
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-md" (click)="showTransferModal.set(false)"></div>
        <div class="relative w-full max-w-lg bg-[#0a122d] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-200">
          <div class="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 class="font-syne text-xl font-bold text-white">Transférer à...</h2>
            <button (click)="showTransferModal.set(false)" class="text-txt-muted hover:text-white transition-colors">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
            @for (conv of conversations(); track conv.id) {
              <button (click)="forwardTo(conv.id)" class="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 border border-white/5 mb-2 transition-all group">
                <div class="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center font-bold text-white uppercase italic border border-white/10">{{ getOtherUser(conv).username[0] }}</div>
                <p class="text-sm font-bold text-white">{{ getOtherUser(conv).username }}</p>
                <svg class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-accent-bright" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
              </button>
            }
          </div>
        </div>
      </div>
    }
    `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 111, 245, 0.2); border-radius: 10px; }
    :host { display: block; height: 100%; width: 100%; min-height: 500px; }
    @media (max-width: 1024px) {
      .chat-wrapper {
        height: calc(100vh - 180px) !important;
        max-height: calc(100vh - 180px) !important;
      }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private socket?: WebSocket;

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  tab = signal<'recents' | 'contacts'>('recents');
  sidebarVisible = signal(true);
  searchQuery = '';
  searchResults = signal<User[]>([]);
  showAddModal = signal(false);
  memberList = signal<User[]>([]);

  conversations = signal<Conversation[]>([]);
  contacts = signal<any[]>([]);
  selectedConv = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);

  // Selection & Advanced Actions
  selectionMode = signal(false);
  selectedIds = signal<Set<number>>(new Set());
  showTransferModal = signal(false);

  newMessage = '';
  selectedFile: File | null = null;
  currentUser = this.authService.currentUser;

  ngOnInit() {
    this.loadInitial();
  }

  ngOnDestroy() {
    if (this.socket) this.socket.close();
  }

  loadInitial() {
    // Load Conversations
    this.http.get<Conversation[]>('/api/chat/conversations/').subscribe(res => {
      this.conversations.set(res);
    });
    // Load Contacts
    this.http.get<any[]>('/api/chat/contacts/').subscribe(res => {
      this.contacts.set(res);
    });
    // Load all users for the "Add" button
    this.http.get<User[]>('/api/chat/contacts/search_users/?q=').subscribe(res => {
      this.memberList.set(res);
    });
  }

  searchUsers() {
    if (this.searchQuery.length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.http.get<User[]>(`/api/chat/contacts/search_users/?q=${this.searchQuery}`).subscribe(res => {
      this.searchResults.set(res);
    });
  }

  startConv(user: User) {
    this.searchResults.set([]);
    this.searchQuery = '';
    this.showAddModal.set(false);

    // Ensure we switch tab
    this.tab.set('recents');

    // Add to contacts first
    this.http.post('/api/chat/contacts/', { contact: user.id }).subscribe({
      next: () => {
        // Then start/get conversation
        this.http.post<Conversation>('/api/chat/conversations/start_private/', { recipient_id: user.id }).subscribe(conv => {
          this.loadInitial(); // Refresh lists to show the new contact/conversation
          this.selectConv(conv);
        });
      },
      error: () => {
        // If already contact or error, just try to start conv anyway
        this.http.post<Conversation>('/api/chat/conversations/start_private/', { recipient_id: user.id }).subscribe(conv => {
          this.loadInitial();
          this.selectConv(conv);
        });
      }
    });
  }

  selectConv(conv: Conversation) {
    this.selectedConv.set(conv);
    this.loadMessages(conv.id);
    this.connectWS(conv.id);
  }

  loadMessages(convId: number) {
    this.http.get<Message[]>(`/api/chat/conversations/${convId}/messages/`).subscribe(res => {
      this.messages.set(res.map(m => ({
        ...m,
        isMe: m.sender_username === this.currentUser()?.username
      })));
      this.selectionMode.set(false);
      this.selectedIds.set(new Set());
      this.scrollToBottom();
    });
  }

  connectWS(convId: number) {
    if (this.socket) this.socket.close();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.socket = new WebSocket(`${protocol}//${host}/ws/chat/${convId}/`);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        this.messages.update(msgs => [...msgs, {
          sender_username: data.username,
          content: data.message,
          timestamp: data.timestamp,
          file: data.file,
          file_name: data.file_name,
          file_type: data.file_type
        }]);
        this.scrollToBottom();
      }
    };
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  sendMessage() {
    const conv = this.selectedConv();
    if (!conv) return;

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('content', this.newMessage);

      this.http.post<Message>(`/api/chat/conversations/${conv.id}/send_file/`, formData).subscribe(res => {
        this.socket?.send(JSON.stringify({
          file_id: res.id,
          file_url: res.file,
          file_name: res.file_name,
          file_type: res.file_type,
          message: this.newMessage
        }));
        this.selectedFile = null;
        this.newMessage = '';
      });
    } else if (this.newMessage.trim()) {
      this.socket?.send(JSON.stringify({
        message: this.newMessage
      }));
      this.newMessage = '';
    }
  }

  getOtherUser(conv: Conversation): User {
    const other = conv.participants.find(p => p.username !== this.currentUser()?.username);
    return other || { id: 0, username: 'Moi' };
  }

  startCall(isVideo: boolean) {
    const conv = this.selectedConv();
    if (!conv) return;

    // Generate a unique room name based on conversation ID
    // We add a prefix to avoid collisions with other users on Jitsi public server
    const roomName = `ESMT_Tasks_Room_${conv.id}`;

    // Build the Jitsi URL
    // config.startWithAudioMuted=false etc. can be added as query params
    let jitsiUrl = `https://meet.jit.si/${roomName}#config.startWithVideoMuted=${!isVideo}`;

    // Add User display name to Jitsi
    const displayName = this.currentUser()?.username || 'Utilisateur ESMT';
    jitsiUrl += `&userInfo.displayName="${displayName}"`;

    // Notify the other user through the chat that a call is starting
    const messageContent = isVideo
      ? "📞 Je lance un appel vidéo. Cliquez pour rejoindre : "
      : "📞 Je lance un appel audio. Cliquez pour rejoindre : ";

    this.socket?.send(JSON.stringify({
      message: `${messageContent} ${jitsiUrl}`
    }));

    // Open Jitsi in a new tab
    window.open(jitsiUrl, '_blank');
  }

  // Selection & Advanced Actions
  toggleSelection(msgId: number | undefined) {
    if (!msgId) return;
    const current = new Set(this.selectedIds());
    if (current.has(msgId)) {
      current.delete(msgId);
    } else {
      current.add(msgId);
    }
    this.selectedIds.set(current);
    if (current.size === 0) this.selectionMode.set(false);
  }

  enterSelectionMode(msgId?: number) {
    this.selectionMode.set(true);
    if (msgId) {
      this.selectedIds.set(new Set([msgId]));
    }
  }

  cancelSelection() {
    this.selectionMode.set(false);
    this.selectedIds.set(new Set());
  }

  isMessageSelected(msgId: number | undefined): boolean {
    return !!msgId && this.selectedIds().has(msgId);
  }

  deleteSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (confirm(`Voulez-vous supprimer ces ${ids.length} messages ?`)) {
      this.http.post('/api/chat/messages/batch_delete/', { message_ids: ids }).subscribe(() => {
        // Optimistic update or reload
        const currentConv = this.selectedConv();
        if (currentConv) this.loadMessages(currentConv.id);
        this.selectionMode.set(false);
        this.selectedIds.set(new Set());
      });
    }
  }

  forwardTo(convId: number) {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.http.post('/api/chat/messages/forward/', {
      message_ids: ids,
      conversation_id: convId
    }).subscribe(() => {
      this.showTransferModal.set(false);
      this.selectionMode.set(false);
      this.selectedIds.set(new Set());
      alert("Messages transférés avec succès !");

      // If we are already in that conversation, reload
      if (this.selectedConv()?.id === convId) {
        this.loadMessages(convId);
      } else {
        // Otherwise maybe switch to it?
        const targetConv = this.conversations().find(c => c.id === convId);
        if (targetConv) this.selectConv(targetConv);
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
