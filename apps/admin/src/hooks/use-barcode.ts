import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const barcodeKeys = {
  all: ['barcode'] as const,
  lookup: (code: string) => [...barcodeKeys.all, 'lookup', code] as const,
};

export function useBarcodeLookup(code: string) {
  return useQuery({
    queryKey: barcodeKeys.lookup(code),
    queryFn: () => api.get(`/barcode/lookup/${encodeURIComponent(code)}`),
    enabled: !!code && code.length >= 3,
  });
}

export function useGenerateBarcode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) =>
      api.post<{ barcode: string; svg: string }>(`/barcode/generate/${variantId}`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useGenerateMissingBarcodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ generated: number }>('/barcode/generate-missing', {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useGenerateLabels() {
  return useMutation({
    mutationFn: async ({ variantIds, format }: {
      variantIds: string[];
      format: 'small' | 'medium' | 'large';
    }) => {
      const response = await fetch('/api/barcode/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ variantIds, format }),
      });
      if (!response.ok) throw new Error('Failed to generate labels');
      return response.blob();
    },
  });
}

export function useAssignBarcode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, barcode, barcodeFormat }: {
      variantId: string;
      barcode: string;
      barcodeFormat?: string;
    }) => api.put(`/variants/${variantId}/barcode`, { barcode, barcodeFormat }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
