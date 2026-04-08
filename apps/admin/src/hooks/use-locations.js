import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const locationKeys = {
    all: ['locations'],
    list: () => [...locationKeys.all, 'list'],
    stock: (locationId) => [...locationKeys.all, 'stock', locationId],
    lowStock: (locationId) => [...locationKeys.all, 'low-stock', locationId],
    outOfStock: (locationId) => [...locationKeys.all, 'out-of-stock', locationId],
};
export function useLocations() {
    return useQuery({
        queryKey: locationKeys.list(),
        queryFn: () => api.get('/locations'),
    });
}
export function useLocationStock(locationId) {
    return useQuery({
        queryKey: locationKeys.stock(locationId),
        queryFn: () => api.get(`/locations/${locationId}/stock`),
        enabled: !!locationId,
    });
}
export function useLowStockByLocation(locationId) {
    return useQuery({
        queryKey: locationKeys.lowStock(locationId),
        queryFn: () => api.get(`/locations/${locationId}/low-stock`),
        enabled: !!locationId,
        refetchInterval: 60_000,
    });
}
export function useCreateLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/locations', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: locationKeys.all });
        },
    });
}
export function useUpdateLocationStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ variantId, locationId, quantity, reason }) => api.put(`/variants/${variantId}/stock/${locationId}`, { quantity, reason }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: locationKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}
export function useTransferStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/stock/transfer', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: locationKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}
export function useStockMatrix(variantId) {
    return useQuery({
        queryKey: [...locationKeys.all, 'matrix', variantId],
        queryFn: () => api.get(`/variants/${variantId}/stock-matrix`),
        enabled: !!variantId,
    });
}
