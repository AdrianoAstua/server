import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const shopifyKeys = {
    all: ['shopify'],
    syncLogs: (params) => [...shopifyKeys.all, 'sync-logs', params],
};
export function useShopifySyncLogs(params) {
    const searchParams = new URLSearchParams();
    if (params?.page)
        searchParams.set('page', String(params.page));
    if (params?.limit)
        searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return useQuery({
        queryKey: shopifyKeys.syncLogs(params),
        queryFn: () => api.get(`/shopify/sync-logs${qs ? `?${qs}` : ''}`),
    });
}
export function useSyncToShopify() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variantId) => api.post('/shopify/sync', { variantId }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: shopifyKeys.all });
        },
    });
}
export function useImportFromShopify() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/shopify/import', {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: shopifyKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
export function useReconcileShopify() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/shopify/reconcile', {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: shopifyKeys.all });
        },
    });
}
export function useLinkVariantToShopify() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/shopify/link-variant', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
