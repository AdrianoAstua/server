import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-client';
import type { NotificationItem, NotificationListParams } from '@/types/api';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: NotificationListParams) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

/**
 * Query: paginated notifications with optional type/read filters.
 */
export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.read !== undefined) searchParams.set('read', String(params.read));
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      const qs = searchParams.toString();
      return api.get<PaginatedResponse<NotificationItem>>(
        `/notifications${qs ? `?${qs}` : ''}`,
      );
    },
  });
}

/**
 * Query: unread notification count. Polls every 30 seconds.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 30_000,
  });
}

/**
 * Mutation: mark a single notification as read.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.patch<void>(`/notifications/${notificationId}/read`, { read: true }),
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
    mutationFn: () => api.post<void>('/notifications/read-all', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
