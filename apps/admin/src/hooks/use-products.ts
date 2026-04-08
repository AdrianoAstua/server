import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api-client';
import type {
  ProductItem,
  ProductListParams,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateStockRequest,
} from '@/types/api';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

/**
 * Query: paginated product list with optional filters.
 */
export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      const qs = searchParams.toString();
      return api.get<PaginatedResponse<ProductItem>>(`/products${qs ? `?${qs}` : ''}`);
    },
  });
}

/**
 * Query: single product by ID.
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => api.get<ProductItem>(`/products/${id}`),
    enabled: !!id,
  });
}

/**
 * Mutation: create a new product.
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductRequest) =>
      api.post<ProductItem>('/products', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Mutation: update an existing product.
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProductRequest & { id: string }) =>
      api.put<ProductItem>(`/products/${id}`, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Mutation: delete a product.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/products/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Mutation: update stock for a specific product size.
 */
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStockRequest) =>
      api.patch<ProductItem>(`/products/${payload.productId}/stock`, {
        size: payload.size,
        quantity: payload.quantity,
        operation: payload.operation,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Also invalidate inventory data since stock changed
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
