import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-client';
import type {
  OrderSummary,
  OrderDetail,
  OrderListParams,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderTimelineEntry,
} from '@/types/api';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: OrderListParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  timeline: (id: string) => [...orderKeys.all, 'timeline', id] as const,
};

/**
 * Query: paginated order list with optional filters.
 */
export function useOrders(params?: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.customerId) searchParams.set('customerId', params.customerId);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      const qs = searchParams.toString();
      return api.get<PaginatedResponse<OrderSummary>>(`/orders${qs ? `?${qs}` : ''}`);
    },
  });
}

/**
 * Query: single order detail by ID.
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => api.get<OrderDetail>(`/orders/${id}`),
    enabled: !!id,
  });
}

/**
 * Mutation: create a new order.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderRequest) =>
      api.post<OrderDetail>('/orders', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Invalidate dashboard since order counts changed
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Invalidate inventory since stock may have changed
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Mutation: update the status of an existing order.
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrderStatusRequest) =>
      api.patch<OrderDetail>(`/orders/${payload.orderId}/status`, {
        status: payload.status,
        note: payload.note,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.timeline(variables.orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Mutation: cancel an order.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      api.post<OrderDetail>(`/orders/${orderId}/cancel`, { reason }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Inventory may be restored on cancel
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Query: timeline of status changes for an order.
 */
export function useOrderTimeline(id: string) {
  return useQuery({
    queryKey: orderKeys.timeline(id),
    queryFn: () => api.get<OrderTimelineEntry[]>(`/orders/${id}/timeline`),
    enabled: !!id,
  });
}
