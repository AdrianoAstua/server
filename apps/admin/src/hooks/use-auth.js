import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
export const authKeys = {
    me: ['auth', 'me'],
};
/**
 * Mutation to log in with email and password.
 * On success, stores the token and user profile.
 */
export function useLogin() {
    const login = useAuthStore((s) => s.login);
    return useMutation({
        mutationFn: async (credentials) => {
            const data = await api.post('/auth/login', credentials);
            return data;
        },
        onSuccess: (_data, variables) => {
            // The store login handles token + user setting
            // but we call it via store to keep state in sync
            void login(variables.email, variables.password).catch(() => {
                // Already handled by mutation error
            });
        },
    });
}
/**
 * Mutation to log out. Clears token and all cached queries.
 */
export function useLogout() {
    const logout = useAuthStore((s) => s.logout);
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            try {
                await api.post('/auth/logout', {});
            }
            catch {
                // Logout should succeed even if the API call fails
            }
        },
        onSettled: () => {
            logout();
            queryClient.clear();
        },
    });
}
/**
 * Query for the current authenticated user profile.
 * Only enabled when we have a token.
 */
export function useMe() {
    const token = useAuthStore((s) => s.token);
    const setUser = useAuthStore((s) => s.setUser);
    return useQuery({
        queryKey: authKeys.me,
        queryFn: async () => {
            const user = await api.get('/auth/me');
            setUser(user);
            return user;
        },
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
/**
 * Mutation to change the current user's password.
 */
export function useChangePassword() {
    return useMutation({
        mutationFn: async (payload) => {
            return api.post('/auth/change-password', payload);
        },
    });
}
