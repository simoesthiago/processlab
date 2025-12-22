/**
 * API Client
 * 
 * Base client for making API requests.
 * No authentication needed for local-first single-user mode.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

export interface FetchOptions extends RequestInit {
    token?: string | null;  // Kept for compatibility but unused
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, headers = {}, ...rest } = options;

    // No Bearer token needed for local-first single-user mode
    const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    };

    let response: Response;

    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            headers: authHeaders,
            ...rest,
        });
    } catch (error: any) {
        // Handle network errors
        const errorMessage = error?.message || 'Failed to fetch';
        console.error(`[apiFetch] Network error for ${endpoint}:`, errorMessage);

        const networkError = new ApiError(
            `Network error: ${errorMessage}. Please check if the API server is running at ${API_URL}`,
            0,
            { networkError: true, originalError: errorMessage }
        );

        throw networkError;
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMessage = data.error?.message || data.detail || data.message || 'API Request Failed';
        throw new ApiError(errorMessage, response.status, data);
    }

    return data;
}

