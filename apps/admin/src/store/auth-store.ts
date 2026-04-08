import { create } from 'zustand';
import type { UserProfile } from '@/types/api';
import { api } from '@/lib/api-client';

interface AuthStore {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;

  /** Attempt login with email and password. Sets token and user on success. */
  login: (email: string, password: string) => Promise<void>;

  /** Clear auth state and API token. */
  logout: () => void;

  /** Update the current user profile in store. */
  setUser: (user: UserProfile) => void;

  /** Hydrate token from localStorage on app init. */
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const { token, user } = await api.post<{ token: string; user: UserProfile }>(
      '/auth/login',
      { email, password },
    );
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
