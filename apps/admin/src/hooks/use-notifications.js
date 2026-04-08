import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const notificationKeys = {
    all: ['notifications'],
    lists: () => [...notificationKeys.all, 'list'],
    list: (params) => [...notificationKeys.lists(), params],
    unreadCount: () => [...notificationKeys.all, 'unread-count'],
};
/**
 * Query: paginated notifications with optional type/read filters.
 */
export function useNotifications(params) {
    return useQuery({
        queryKey: notificationKeys.list(params),
        queryFn: () => {
            const searchParams = new URLSearchParams();
            if (params?.type)
                searchParams.set('type', params.type);
            if (params?.read !== undefined)
                searchParams.set('read', String(params.read));
            if (params?.page)
                searchParams.set('page', String(params.page));
            if (params?.pageSize)
                searchParams.set('pageSize', String(params.pageSize));
            const qs = searchParams.toString();
            return api.get(`/notifications${qs ? `?${qs}` : ''}`);
        },
    });
}
/**
 * Query: unread notification count. Polls every 30 seconds.
 */
export function useUnreadCount() {
    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: () => api.get('/notifications/unread-count'),
        refetchInterval: 30_000,
    });
}
/**
 * Mutation: mark a single notification as read.
 */
export function useMarkAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (notificationId) => api.patch(`/notifications/${notificationId}/read`, { read: true }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        },
    });
}
/**
 * Mutation: mark all notifications as read.
 */
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/notifications/read-all', {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        },
    });
}
