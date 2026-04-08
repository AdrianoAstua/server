import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const localSaleKeys = {
    all: ['local-sales'],
    list: (params) => [...localSaleKeys.all, 'list', params],
    detail: (id) => [...localSaleKeys.all, 'detail', id],
    dailySummary: (date, locationId) => [...localSaleKeys.all, 'summary', date, locationId],
};
export function useLocalSales(params) {
    const searchParams = new URLSearchParams();
    if (params?.date)
        searchParams.set('date', params.date);
    if (params?.soldById)
        searchParams.set('soldById', params.soldById);
    if (params?.paymentMethod)
        searchParams.set('paymentMethod', params.paymentMethod);
    if (params?.page)
        searchParams.set('page', String(params.page));
    if (params?.limit)
        searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return useQuery({
        queryKey: localSaleKeys.list(params),
        queryFn: () => api.get(`/local-sales${qs ? `?${qs}` : ''}`),
    });
}
export function useLocalSale(id) {
    return useQuery({
        queryKey: localSaleKeys.detail(id),
        queryFn: () => api.get(`/local-sales/${id}`),
        enabled: !!id,
    });
}
export function useCreateLocalSale() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/local-sales', data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: localSaleKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}
export function useVoidSale() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }) => api.post(`/local-sales/${id}/void`, { reason }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: localSaleKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['products'] });
            void queryClient.invalidateQueries({ queryKey: ['inventory'] });
            void queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}
export function useDailySummary(date, locationId) {
    const searchParams = new URLSearchParams();
    if (date)
        searchParams.set('date', date);
    if (locationId)
        searchParams.set('locationId', locationId);
    const qs = searchParams.toString();
    return useQuery({
        queryKey: localSaleKeys.dailySummary(date, locationId),
        queryFn: () => api.get(`/local-sales/daily-summary${qs ? `?${qs}` : ''}`),
    });
}
export function useSaleReceipt(id) {
    return useQuery({
        queryKey: [...localSaleKeys.all, 'receipt', id],
        queryFn: async () => {
            const response = await fetch(`/api/local-sales/${id}/receipt`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            return response.text();
        },
        enabled: !!id,
    });
}
