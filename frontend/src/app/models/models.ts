export enum Role {
    ETUDIANT = 'etudiant',
    PROFESSEUR = 'professeur'
}

export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    role: Role;
    avatar?: string;
    bio?: string;
}

export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    DONE = 'done'
}

export interface Task {
    id: number;
    project: number;
    project_name?: string;
    title: string;
    description: string;
    status: TaskStatus;
    deadline?: string;
    assigned_to?: number;
    assigned_to_username?: string;
    completed_at?: string;
}

export interface ProjectMember {
    id: number;
    project: number;
    user: number;
    username: string;
    full_name: string;
    role: Role;
    joined_at: string;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    owner: number;
    owner_username: string;
    created_at: string;
    updated_at: string;
    members_count: number;
    project_tasks?: Task[];
    members?: ProjectMember[];
}

export interface Stats {
    id: number;
    user: User;
    period_type: string;
    year: number;
    quarter: number;
    total_tasks: number;
    completed_tasks: number;
    completion_rate: number;
    generated_at: string;
}

export interface Prime {
    id: number;
    user: User;
    amount: number;
    year: number;
    completion_rate: number;
    attributed_at: string;
}

export interface Notification {
    id: number;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export interface Message {
    id: number;
    sender: number;
    recipient: number;
    subject: string;
    body: string;
    is_read: boolean;
    created_at: string;
    sender_username?: string;
    sender_full_name?: string;
    recipient_username?: string;
    recipient_full_name?: string;
}

export interface UserMinimal {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
}
