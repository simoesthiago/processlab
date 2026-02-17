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
    silent?: boolean;  // If true, don't log errors to console
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, headers = {}, silent = false, ...rest } = options;
    const fullUrl = `${API_URL}${endpoint}`;

    // No Bearer token needed for local-first single-user mode
    const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    };

    if (!silent) {
        console.log(`[apiFetch] Fazendo requisição para: ${fullUrl}`);
    }

    let response: Response;

    try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 10000); // 10 second timeout

        try {
            response = await fetch(fullUrl, {
                headers: authHeaders,
                ...rest,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!silent) {
                console.log(`[apiFetch] Resposta recebida para ${endpoint}:`, { status: response.status, ok: response.ok });
            }
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('Request timeout: API server did not respond within 10 seconds');
            }
            throw fetchError;
        }
    } catch (error: any) {
        // Handle network errors
        const errorMessage = error?.message || 'Failed to fetch';
        if (!silent) {
            console.error(`[apiFetch] Network error for ${endpoint}:`, errorMessage);
        }

        const networkError = new ApiError(
            `Network error: ${errorMessage}. Please check if the API server is running at ${API_URL}`,
            0,
            { networkError: true, originalError: errorMessage }
        );

        throw networkError;
    }

    // Handle 204 No Content
    if (response.status === 204) {
        console.log(`[apiFetch] 204 No Content para ${endpoint}`);
        return {} as T;
    }

    const data = await response.json().catch((err) => {
        if (!silent) {
            console.error(`[apiFetch] Erro ao parsear JSON para ${endpoint}:`, err);
        }
        return {};
    });

    if (!response.ok) {
        const errorMessage = data.error?.message || data.detail || data.message || 'API Request Failed';
        if (!silent) {
            console.error(`[apiFetch] Erro na resposta para ${endpoint}:`, { status: response.status, errorMessage, data });
        }
        throw new ApiError(errorMessage, response.status, data);
    }

    if (!silent) {
        console.log(`[apiFetch] Sucesso para ${endpoint}:`, data);
    }
    return data;
}

