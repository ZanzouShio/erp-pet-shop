import axios from 'axios';

export const API_URL = 'http://localhost:3001/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If 401 (no token) or 403 (invalid/expired token), redirect to login
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                console.warn('Token inválido ou expirado. Redirecionando para login...');

                // Clear stored auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Redirect to login
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Authenticated fetch wrapper - use this instead of native fetch for API calls
 * Automatically adds auth header and redirects to login on token expiration
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Handle auth errors
    if (response.status === 401 || response.status === 403) {
        if (!window.location.pathname.includes('/login')) {
            console.warn('Token inválido ou expirado. Redirecionando para login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }

    return response;
}
