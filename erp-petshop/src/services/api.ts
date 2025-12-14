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
