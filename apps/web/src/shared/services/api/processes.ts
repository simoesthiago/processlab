/**
 * Process Service
 * 
 * API client for process operations.
 */

import { apiFetch } from './client';

export interface Process {
    id: string;
    name: string;
    description?: string | null;
    folder_id?: string | null;
    user_id?: string | null;
    current_version_id?: string;
    created_at?: string;
    updated_at?: string;
    version_count?: number;
    status?: string;
}

export interface CreateProcessDto {
    name: string;
    description?: string;
    folder_id?: string | null;
}

export interface UpdateProcessDto {
    name?: string;
    description?: string;
    folder_id?: string | null;
    position?: number;
}

export class ProcessService {
    async findAll(folderId?: string | null, search?: string): Promise<Process[]> {
        const params = new URLSearchParams();
        if (folderId !== undefined) {
            params.append('folder_id', folderId || '');
        }
        if (search) {
            params.append('search', search);
        }
        
        const query = params.toString();
        return apiFetch<Process[]>(`/api/v1/processes${query ? `?${query}` : ''}`);
    }

    async findById(id: string): Promise<Process> {
        return apiFetch<Process>(`/api/v1/processes/${id}`);
    }

    async create(data: CreateProcessDto): Promise<Process> {
        return apiFetch<Process>('/api/v1/spaces/private/processes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async update(id: string, data: UpdateProcessDto): Promise<Process> {
        return apiFetch<Process>(`/api/v1/processes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(id: string): Promise<void> {
        return apiFetch<void>(`/api/v1/processes/${id}`, {
            method: 'DELETE',
        });
    }

    async move(id: string, folderId: string | null, position?: number): Promise<Process> {
        return apiFetch<Process>(`/api/v1/processes/${id}/move`, {
            method: 'PUT',
            body: JSON.stringify({ folder_id: folderId, position }),
        });
    }
}

export const processService = new ProcessService();

