import { create } from 'zustand';
import { api } from '@/lib/api-client';
export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: async (email, password) => {
        const { token, user } = await api.post('/auth/login', { email, password });
        api.setToken(token);
        set({ token, user, isAuthenticated: true });
    },
    logout: () => {
        api.clearToken();
        set({ token: null, user: null, isAuthenticated: false });
    },
    setUser: (user) => {
        set({ user });
    },
    hydrate: () => {
        const token = api.getToken();
        if (token) {
            set({ token, isAuthenticated: true });
        }
    },
}));
