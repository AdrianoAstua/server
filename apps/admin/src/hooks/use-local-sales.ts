import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-client';
import type { LocalSale, DailySummary, PaymentMethod } from '@/types/inventory';

export const localSaleKeys = {
  all: ['local-sales'] as const,
  list: (params?: Record<string, string>) => [...localSaleKeys.all, 'list', params] as const,
  detail: (id: string) => [...localSaleKeys.all, 'detail', id] as const,
  dailySummary: (date?: string, locationId?: string) =>
    [...localSaleKeys.all, 'summary', date, locationId] as const,
};

export function useLocalSales(params?: {
  date?: string;
  soldById?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set('date', params.date);
  if (params?.soldById) searchParams.set('soldById', params.soldById);
  if (params?.paymentMethod) searchParams.set('paymentMethod', params.paymentMethod);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: localSaleKeys.list(params as Record<string, string>),
    queryFn: () =>
      api.get<PaginatedResponse<LocalSale>>(`/local-sales${qs ? `?${qs}` : ''}`),
  });
}

export function useLocalSale(id: string) {
  return useQuery({
    queryKey: localSaleKeys.detail(id),
    queryFn: () => api.get<LocalSale>(`/local-sales/${id}`),
    enabled: !!id,
  });
}

export function useCreateLocalSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      items: { variantId: string; quantity: number }[];
      paymentMethod: PaymentMethod;
      customerId?: string;
      discountCents?: number;
      notes?: string;
    }) => api.post<LocalSale>('/local-sales', data),
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
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/local-sales/${id}/void`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: localSaleKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useDailySummary(date?: string, locationId?: string) {
  const searchParams = new URLSearchParams();
  if (date) searchParams.set('date', date);
  if (locationId) searchParams.set('locationId', locationId);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: localSaleKeys.dailySummary(date, locationId),
    queryFn: () =>
      api.get<DailySummary>(`/local-sales/daily-summary${qs ? `?${qs}` : ''}`),
  });
}

export function useSaleReceipt(id: string) {
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
