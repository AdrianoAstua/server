import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-client';
import type {
  CustomerSummary,
  CustomerDetail,
  CustomerListParams,
  CustomerStatsResponse,
} from '@/types/api';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: CustomerListParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  stats: (id: string) => [...customerKeys.all, 'stats', id] as const,
};

/**
 * Query: paginated customer list with optional filters.
 */
export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.city) searchParams.set('city', params.city);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      const qs = searchParams.toString();
      return api.get<PaginatedResponse<CustomerSummary>>(`/customers${qs ? `?${qs}` : ''}`);
    },
  });
}

/**
 * Query: single customer detail by ID.
 */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => api.get<CustomerDetail>(`/customers/${id}`),
    enabled: !!id,
  });
}

/**
 * Query: aggregated stats for a specific customer.
 */
export function useCustomerStats(id: string) {
  return useQuery({
    queryKey: customerKeys.stats(id),
    queryFn: () => api.get<CustomerStatsResponse>(`/customers/${id}/stats`),
    enabled: !!id,
  });
}
