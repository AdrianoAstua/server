import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-client';
import type { ShopifySync } from '@/types/inventory';

export const shopifyKeys = {
  all: ['shopify'] as const,
  syncLogs: (params?: { page?: number; limit?: number }) =>
    [...shopifyKeys.all, 'sync-logs', params] as const,
};

export function useShopifySyncLogs(params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: shopifyKeys.syncLogs(params),
    queryFn: () =>
      api.get<PaginatedResponse<ShopifySync>>(`/shopify/sync-logs${qs ? `?${qs}` : ''}`),
  });
}

export function useSyncToShopify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId?: string) =>
      api.post<ShopifySync>('/shopify/sync', { variantId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shopifyKeys.all });
    },
  });
}

export function useImportFromShopify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ imported: number; updated: number; errors: number }>(
        '/shopify/import',
        {},
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shopifyKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useReconcileShopify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ShopifySync>('/shopify/reconcile', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shopifyKeys.all });
    },
  });
}

export function useLinkVariantToShopify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      variantId: string;
      shopifyVariantId: string;
      shopifyInventoryItemId: string;
    }) => api.post('/shopify/link-variant', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
