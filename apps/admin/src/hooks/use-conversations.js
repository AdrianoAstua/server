import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const conversationKeys = {
    all: ['conversations'],
    lists: () => [...conversationKeys.all, 'list'],
    list: (params) => [...conversationKeys.lists(), params],
    details: () => [...conversationKeys.all, 'detail'],
    detail: (id) => [...conversationKeys.details(), id],
    messages: (id, params) => [...conversationKeys.all, 'messages', id, params],
    stats: () => [...conversationKeys.all, 'stats'],
};
/**
 * Query: list conversations with optional filters and pagination.
 */
export function useConversations(params) {
    return useQuery({
        queryKey: conversationKeys.list(params),
        queryFn: () => {
            const searchParams = new URLSearchParams();
            if (params?.status)
                searchParams.set('status', params.status);
            if (params?.agentId)
                searchParams.set('agentId', params.agentId);
            if (params?.search)
                searchParams.set('search', params.search);
            if (params?.page)
                searchParams.set('page', String(params.page));
            if (params?.pageSize)
                searchParams.set('pageSize', String(params.pageSize));
            const qs = searchParams.toString();
            return api.get(`/conversations${qs ? `?${qs}` : ''}`);
        },
        refetchInterval: 15_000, // Poll every 15s for new conversations
    });
}
/**
 * Query: single conversation detail by ID.
 */
export function useConversation(id) {
    return useQuery({
        queryKey: conversationKeys.detail(id),
        queryFn: () => api.get(`/conversations/${id}`),
        enabled: !!id,
    });
}
/**
 * Query: paginated messages for a conversation.
 */
export function useConversationMessages(id, params) {
    return useQuery({
        queryKey: conversationKeys.messages(id, params),
        queryFn: () => {
            const searchParams = new URLSearchParams();
            if (params?.page)
                searchParams.set('page', String(params.page));
            if (params?.pageSize)
                searchParams.set('pageSize', String(params.pageSize));
            if (params?.before)
                searchParams.set('before', params.before);
            const qs = searchParams.toString();
            return api.get(`/conversations/${id}/messages${qs ? `?${qs}` : ''}`);
        },
        enabled: !!id,
        refetchInterval: 5_000, // Poll every 5s for new messages
    });
}
/**
 * Mutation: send a message as agent in a conversation.
 */
export function useSendAgentMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post(`/conversations/${payload.conversationId}/messages`, {
            content: payload.content,
            type: payload.type ?? 'text',
        }),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.messages(variables.conversationId),
            });
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.lists(),
            });
        },
    });
}
/**
 * Mutation: take a conversation (assign to current agent).
 */
export function useTakeConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId) => api.post(`/conversations/${conversationId}/take`, {}),
        onSuccess: (_data, conversationId) => {
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.detail(conversationId),
            });
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.lists(),
            });
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.stats(),
            });
        },
    });
}
/**
 * Mutation: release a conversation back to bot.
 */
export function useReleaseConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId) => api.post(`/conversations/${conversationId}/release`, {}),
        onSuccess: (_data, conversationId) => {
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.detail(conversationId),
            });
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.lists(),
            });
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.stats(),
            });
        },
    });
}
/**
 * Mutation: close a conversation.
 */
export function useCloseConversation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId) => api.post(`/conversations/${conversationId}/close`, {}),
        onSuccess: (_data, conversationId) => {
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.detail(conversationId),
            });
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.lists(),
            });
            void queryClient.invalidateQueries({
                queryKey: conversationKeys.stats(),
            });
        },
    });
}
/**
 * Query: conversation status counts (bot, waiting, agent, etc.).
 */
export function useConversationStats() {
    return useQuery({
        queryKey: conversationKeys.stats(),
        queryFn: () => api.get('/conversations/stats'),
        refetchInterval: 30_000,
    });
}
