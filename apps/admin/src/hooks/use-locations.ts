import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { InventoryLocation, LocationStock } from '@/types/inventory';

export const locationKeys = {
  all: ['locations'] as const,
  list: () => [...locationKeys.all, 'list'] as const,
  stock: (locationId: string) => [...locationKeys.all, 'stock', locationId] as const,
  lowStock: (locationId: string) => [...locationKeys.all, 'low-stock', locationId] as const,
  outOfStock: (locationId: string) => [...locationKeys.all, 'out-of-stock', locationId] as const,
};

export function useLocations() {
  return useQuery({
    queryKey: locationKeys.list(),
    queryFn: () => api.get<InventoryLocation[]>('/locations'),
  });
}

export function useLocationStock(locationId: string) {
  return useQuery({
    queryKey: locationKeys.stock(locationId),
    queryFn: () => api.get<LocationStock[]>(`/locations/${locationId}/stock`),
    enabled: !!locationId,
  });
}

export function useLowStockByLocation(locationId: string) {
  return useQuery({
    queryKey: locationKeys.lowStock(locationId),
    queryFn: () => api.get<LocationStock[]>(`/locations/${locationId}/low-stock`),
    enabled: !!locationId,
    refetchInterval: 60_000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InventoryLocation>) =>
      api.post<InventoryLocation>('/locations', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

export function useUpdateLocationStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, locationId, quantity, reason }: {
      variantId: string;
      locationId: string;
      quantity: number;
      reason: string;
    }) => api.put(`/variants/${variantId}/stock/${locationId}`, { quantity, reason }),
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
    mutationFn: (data: {
      variantId: string;
      fromLocationId: string;
      toLocationId: string;
      quantity: number;
      reason: string;
    }) => api.post('/stock/transfer', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useStockMatrix(variantId: string) {
  return useQuery({
    queryKey: [...locationKeys.all, 'matrix', variantId],
    queryFn: () => api.get(`/variants/${variantId}/stock-matrix`),
    enabled: !!variantId,
  });
}
