import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const customerKeys = {
    all: ['customers'],
    lists: () => [...customerKeys.all, 'list'],
    list: (params) => [...customerKeys.lists(), params],
    details: () => [...customerKeys.all, 'detail'],
    detail: (id) => [...customerKeys.details(), id],
    stats: (id) => [...customerKeys.all, 'stats', id],
};
/**
 * Query: paginated customer list with optional filters.
 */
export function useCustomers(params) {
    return useQuery({
        queryKey: customerKeys.list(params),
        queryFn: () => {
            const searchParams = new URLSearchParams();
            if (params?.search)
                searchParams.set('search', params.search);
            if (params?.city)
                searchParams.set('city', params.city);
            if (params?.page)
                searchParams.set('page', String(params.page));
            if (params?.pageSize)
                searchParams.set('pageSize', String(params.pageSize));
            if (params?.sortBy)
                searchParams.set('sortBy', params.sortBy);
            if (params?.sortOrder)
                searchParams.set('sortOrder', params.sortOrder);
            const qs = searchParams.toString();
            return api.get(`/customers${qs ? `?${qs}` : ''}`);
        },
    });
}
/**
 * Query: single customer detail by ID.
 */
export function useCustomer(id) {
    return useQuery({
        queryKey: customerKeys.detail(id),
        queryFn: () => api.get(`/customers/${id}`),
        enabled: !!id,
    });
}
/**
 * Query: aggregated stats for a specific customer.
 */
export function useCustomerStats(id) {
    return useQuery({
        queryKey: customerKeys.stats(id),
        queryFn: () => api.get(`/customers/${id}/stats`),
        enabled: !!id,
    });
}
