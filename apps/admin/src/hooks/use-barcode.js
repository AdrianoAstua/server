import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const barcodeKeys = {
    all: ['barcode'],
    lookup: (code) => [...barcodeKeys.all, 'lookup', code],
};
export function useBarcodeLookup(code) {
    return useQuery({
        queryKey: barcodeKeys.lookup(code),
        queryFn: () => api.get(`/barcode/lookup/${encodeURIComponent(code)}`),
        enabled: !!code && code.length >= 3,
    });
}
export function useGenerateBarcode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variantId) => api.post(`/barcode/generate/${variantId}`, {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
export function useGenerateMissingBarcodes() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.post('/barcode/generate-missing', {}),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
export function useGenerateLabels() {
    return useMutation({
        mutationFn: async ({ variantIds, format }) => {
            const response = await fetch('/api/barcode/labels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ variantIds, format }),
            });
            if (!response.ok)
                throw new Error('Failed to generate labels');
            return response.blob();
        },
    });
}
export function useAssignBarcode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ variantId, barcode, barcodeFormat }) => api.put(`/variants/${variantId}/barcode`, { barcode, barcodeFormat }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
