const API_BASE = import.meta.env.VITE_API_URL || '/api';
export class ApiError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}
class ApiClient {
    token = null;
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }
    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('auth_token');
        }
        return this.token;
    }
    async request(path, options) {
        const currentToken = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        };
        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                ...headers,
                ...options?.headers,
            },
        });
        if (res.status === 401) {
            this.clearToken();
            throw new ApiError('UNAUTHORIZED', 'Session expired. Please log in again.');
        }
        const json = (await res.json());
        if (!json.success) {
            throw new ApiError(json.error?.code ?? 'UNKNOWN_ERROR', json.error?.message ?? 'An unexpected error occurred', json.error?.details);
        }
        return json.data;
    }
    async get(path) {
        return this.request(path, { method: 'GET' });
    }
    async post(path, body) {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
    async put(path, body) {
        return this.request(path, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }
    async patch(path, body) {
        return this.request(path, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }
    async delete(path) {
        return this.request(path, { method: 'DELETE' });
    }
    /**
     * Create an EventSource for SSE endpoints with auth token as query param.
     */
    createEventSource(path) {
        const currentToken = this.getToken();
        const url = new URL(`${API_BASE}${path}`, window.location.origin);
        if (currentToken) {
            url.searchParams.set('token', currentToken);
        }
        return new EventSource(url.toString());
    }
}
export const api = new ApiClient();
