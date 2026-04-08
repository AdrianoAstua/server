import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const inventoryKeys = {
    all: ['inventory'],
    movements: (params) => [...inventoryKeys.all, 'movements', params],
    alerts: () => [...inventoryKeys.all, 'alerts'],
    valuation: () => [...inventoryKeys.all, 'valuation'],
};
/**
 * Query: paginated inventory movements with optional filters.
 */
export function useInventoryMovements(params) {
    return useQuery({
        queryKey: inventoryKeys.movements(params),
        queryFn: () => {
            const searchParams = new URLSearchParams();
            if (params?.productId)
                searchParams.set('productId', params.productId);
            if (params?.type)
                searchParams.set('type', params.type);
            if (params?.dateFrom)
                searchParams.set('dateFrom', params.dateFrom);
            if (params?.dateTo)
                searchParams.set('dateTo', params.dateTo);
            if (params?.page)
                searchParams.set('page', String(params.page));
            if (params?.pageSize)
                searchParams.set('pageSize', String(params.pageSize));
            const qs = searchParams.toString();
            return api.get(`/inventory/movements${qs ? `?${qs}` : ''}`);
        },
    });
}
/**
 * Mutation: register a stock entry (incoming inventory).
 */
export function useRegisterEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => api.post('/inventory/entries', payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
            // Also refresh product data since stock levels changed
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
/**
 * Query: inventory alerts for low/out-of-stock items.
 */
export function useInventoryAlerts() {
    return useQuery({
        queryKey: inventoryKeys.alerts(),
        queryFn: () => api.get('/inventory/alerts'),
        refetchInterval: 60_000, // Refresh every minute
    });
}
/**
 * Query: total inventory valuation broken down by category.
 */
export function useInventoryValuation() {
    return useQuery({
        queryKey: inventoryKeys.valuation(),
        queryFn: () => api.get('/inventory/valuation'),
    });
}
