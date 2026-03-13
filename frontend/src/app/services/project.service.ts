import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, Task, ProjectMember, TaskStatus } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private apiUrl = '/api/projects/';
    private membersUrl = '/api/members/';

    constructor(private http: HttpClient) { }

    getProjects(): Observable<Project[]> {
        return this.http.get<Project[]>(this.apiUrl);
    }

    getProject(id: number): Observable<Project> {
        return this.http.get<Project>(`${this.apiUrl}${id}/`);
    }

    createProject(project: Partial<Project>): Observable<Project> {
        return this.http.post<Project>(this.apiUrl, project);
    }

    updateProject(id: number, project: Partial<Project>): Observable<Project> {
        return this.http.put<Project>(`${this.apiUrl}${id}/`, project);
    }

    deleteProject(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}${id}/`);
    }

    addMember(member: { project: number, user: number }): Observable<ProjectMember> {
        return this.http.post<ProjectMember>(this.membersUrl, member);
    }

    removeMember(id: number): Observable<any> {
        return this.http.delete(`${this.membersUrl}${id}/`);
    }
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = '/api/tasks/';

    constructor(private http: HttpClient) { }

    getTasks(filters?: any): Observable<Task[]> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params = params.append(key, filters[key]);
                }
            });
        }
        return this.http.get<Task[]>(this.apiUrl, { params });
    }

    createTask(task: Partial<Task>): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, task);
    }

    updateTask(id: number, task: Partial<Task>): Observable<Task> {
        return this.http.patch<Task>(`${this.apiUrl}${id}/`, task);
    }

    deleteTask(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}${id}/`);
    }

    validateTask(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}${id}/validate/`, {});
    }
}
