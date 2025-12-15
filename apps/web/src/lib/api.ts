
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface FetchOptions extends RequestInit {
    token?: string | null;
}

export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, headers = {}, ...rest } = options;

    const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string>),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: authHeaders,
        ...rest,
    });

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(data.detail || data.message || 'API Request Failed', response.status, data);
    }

    return data;
}
