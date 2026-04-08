import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-client';
import type {
  ConversationSummary,
  ConversationDetail,
  ConversationListParams,
  MessageItem,
  MessageListParams,
  SendMessageRequest,
  ConversationStatsResponse,
} from '@/types/api';

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (params?: ConversationListParams) => [...conversationKeys.lists(), params] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  messages: (id: string, params?: MessageListParams) =>
    [...conversationKeys.all, 'messages', id, params] as const,
  stats: () => [...conversationKeys.all, 'stats'] as const,
};

/**
 * Query: list conversations with optional filters and pagination.
 */
export function useConversations(params?: ConversationListParams) {
  return useQuery({
    queryKey: conversationKeys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.agentId) searchParams.set('agentId', params.agentId);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      const qs = searchParams.toString();
      return api.get<PaginatedResponse<ConversationSummary>>(
        `/conversations${qs ? `?${qs}` : ''}`,
      );
    },
    refetchInterval: 15_000, // Poll every 15s for new conversations
  });
}

/**
 * Query: single conversation detail by ID.
 */
export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => api.get<ConversationDetail>(`/conversations/${id}`),
    enabled: !!id,
  });
}

/**
 * Query: paginated messages for a conversation.
 */
export function useConversationMessages(id: string, params?: MessageListParams) {
  return useQuery({
    queryKey: conversationKeys.messages(id, params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      if (params?.before) searchParams.set('before', params.before);
      const qs = searchParams.toString();
      return api.get<PaginatedResponse<MessageItem>>(
        `/conversations/${id}/messages${qs ? `?${qs}` : ''}`,
      );
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
    mutationFn: (payload: SendMessageRequest) =>
      api.post<MessageItem>(`/conversations/${payload.conversationId}/messages`, {
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
    mutationFn: (conversationId: string) =>
      api.post<ConversationDetail>(`/conversations/${conversationId}/take`, {}),
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
    mutationFn: (conversationId: string) =>
      api.post<ConversationDetail>(`/conversations/${conversationId}/release`, {}),
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
    mutationFn: (conversationId: string) =>
      api.post<void>(`/conversations/${conversationId}/close`, {}),
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
    queryFn: () => api.get<ConversationStatsResponse>('/conversations/stats'),
    refetchInterval: 30_000,
  });
}
