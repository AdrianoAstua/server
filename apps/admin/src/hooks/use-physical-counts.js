import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const physicalCountKeys = {
    all: ['physical-counts'],
    list: (params) => [...physicalCountKeys.all, 'list', params],
    detail: (id) => [...physicalCountKeys.all, 'detail', id],
};
export function usePhysicalCounts(params) {
    const searchParams = new URLSearchParams();
    if (params?.locationId)
        searchParams.set('locationId', params.locationId);
    if (params?.status)
        searchParams.set('status', params.status);
    if (params?.page)
        searchParams.set('page', String(params.page));
    if (params?.limit)
        searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return useQuery({
        queryKey: physicalCountKeys.list(params),
        queryFn: () => api.get(`/physical-counts${qs ? `?${qs}` : ''}`),
    });
}
export function usePhysicalCount(id) {
    return useQuery({
        queryKey: physicalCountKeys.detail(id),
        queryFn: () => api.get(`/physical-counts/${id}`),
        enabled: !!id,
    });
}
export function useStartCount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/physical-counts', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: physicalCountKeys.all });
        },
    });
}
export function useCountItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ countId, variantId, actualQty }) => api.put(`/physical-counts/${countId}/items`, { variantId, actualQty }),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: physicalCountKeys.detail(variables.countId),
            });
        },
    });
}
export function useCompleteCount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (countId) => api.post(`/physical-counts/${countId}/complete`, {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: physicalCountKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}
export function useCancelCount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (countId) => api.post(`/physical-counts/${countId}/cancel`, {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: physicalCountKeys.all });
        },
    });
}
