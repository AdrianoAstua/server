import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-client';
import type { PhysicalCount } from '@/types/inventory';

export const physicalCountKeys = {
  all: ['physical-counts'] as const,
  list: (params?: Record<string, string>) => [...physicalCountKeys.all, 'list', params] as const,
  detail: (id: string) => [...physicalCountKeys.all, 'detail', id] as const,
};

export function usePhysicalCounts(params?: {
  locationId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.locationId) searchParams.set('locationId', params.locationId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: physicalCountKeys.list(params as Record<string, string>),
    queryFn: () =>
      api.get<PaginatedResponse<PhysicalCount>>(`/physical-counts${qs ? `?${qs}` : ''}`),
  });
}

export function usePhysicalCount(id: string) {
  return useQuery({
    queryKey: physicalCountKeys.detail(id),
    queryFn: () => api.get<PhysicalCount>(`/physical-counts/${id}`),
    enabled: !!id,
  });
}

export function useStartCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { locationId: string; categoryId?: string; notes?: string }) =>
      api.post<PhysicalCount>('/physical-counts', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: physicalCountKeys.all });
    },
  });
}

export function useCountItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ countId, variantId, actualQty }: {
      countId: string;
      variantId: string;
      actualQty: number;
    }) => api.put(`/physical-counts/${countId}/items`, { variantId, actualQty }),
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
    mutationFn: (countId: string) =>
      api.post<{ itemsCounted: number; discrepancies: number; adjustmentsApplied: number }>(
        `/physical-counts/${countId}/complete`,
        {},
      ),
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
    mutationFn: (countId: string) =>
      api.post(`/physical-counts/${countId}/cancel`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: physicalCountKeys.all });
    },
  });
}
