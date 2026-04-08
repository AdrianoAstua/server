import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { conversationKeys } from './use-conversations';
import { notificationKeys } from './use-notifications';
/**
 * Subscribe to real-time conversation events via SSE.
 * Automatically invalidates relevant queries when events arrive.
 *
 * @param onEvent - Optional callback for custom handling of each event.
 */
export function useConversationEvents(onEvent) {
    const queryClient = useQueryClient();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const eventSourceRef = useRef(null);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;
    const handleEvent = useCallback((event) => {
        // Invalidate relevant queries based on event type
        switch (event.type) {
            case 'new_message':
                void queryClient.invalidateQueries({
                    queryKey: conversationKeys.messages(event.conversationId),
                });
                void queryClient.invalidateQueries({
                    queryKey: conversationKeys.lists(),
                });
                break;
            case 'status_changed':
            case 'agent_joined':
            case 'agent_left':
                void queryClient.invalidateQueries({
                    queryKey: conversationKeys.detail(event.conversationId),
                });
                void queryClient.invalidateQueries({
                    queryKey: conversationKeys.lists(),
                });
                void queryClient.invalidateQueries({
                    queryKey: conversationKeys.stats(),
                });
                break;
            case 'conversation_created':
                void queryClient.invalidateQueries({
                    queryKey: conversationKeys.lists(),
                });
                void queryClient.invalidateQueries({
                    queryKey: conversationKeys.stats(),
                });
                break;
        }
        onEventRef.current?.(event);
    }, [queryClient]);
    useEffect(() => {
        if (!isAuthenticated)
            return;
        const es = api.createEventSource('/events/conversations');
        eventSourceRef.current = es;
        es.onmessage = (messageEvent) => {
            try {
                const data = JSON.parse(messageEvent.data);
                handleEvent(data);
            }
            catch {
                // Ignore malformed events
            }
        };
        es.onerror = () => {
            // EventSource will auto-reconnect on most errors.
            // If the connection is closed permanently, clean up.
            if (es.readyState === EventSource.CLOSED) {
                es.close();
            }
        };
        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, [isAuthenticated, handleEvent]);
}
/**
 * Subscribe to real-time notification events via SSE.
 * Automatically invalidates notification queries when events arrive.
 *
 * @param onEvent - Optional callback for custom handling of each event.
 */
export function useNotificationEvents(onEvent) {
    const queryClient = useQueryClient();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const eventSourceRef = useRef(null);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;
    const handleEvent = useCallback((event) => {
        void queryClient.invalidateQueries({
            queryKey: notificationKeys.lists(),
        });
        void queryClient.invalidateQueries({
            queryKey: notificationKeys.unreadCount(),
        });
        onEventRef.current?.(event);
    }, [queryClient]);
    useEffect(() => {
        if (!isAuthenticated)
            return;
        const es = api.createEventSource('/events/notifications');
        eventSourceRef.current = es;
        es.onmessage = (messageEvent) => {
            try {
                const data = JSON.parse(messageEvent.data);
                handleEvent(data);
            }
            catch {
                // Ignore malformed events
            }
        };
        es.onerror = () => {
            if (es.readyState === EventSource.CLOSED) {
                es.close();
            }
        };
        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, [isAuthenticated, handleEvent]);
}
