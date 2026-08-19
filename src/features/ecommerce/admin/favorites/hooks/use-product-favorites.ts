'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productFavoritesApi,
  type CreateProductFavoriteInput,
  type ProductFavoriteListQuery,
} from '@/features/ecommerce/admin/favorites/lib/api/product-favorites-api';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export const productFavoritesQueryKeys = {
  all: ['ecommerce', 'product-favorites'] as const,
  list: (query: ProductFavoriteListQuery) =>
    [...productFavoritesQueryKeys.all, 'list', query] as const,
};

export function useProductFavorites(query: ProductFavoriteListQuery, enabled = true) {
  return useQuery({
    queryKey: productFavoritesQueryKeys.list(query),
    queryFn: () => productFavoritesApi.list(query),
    enabled:
      enabled &&
      Boolean(query.partnerId || query.productId || query.companyId || query.page != null),
  });
}

export function useCreateProductFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductFavoriteInput) => productFavoritesApi.create(input),
    onSuccess: async () => {
      toast.success('أُضيف المنتج إلى المفضلة');
      await qc.invalidateQueries({ queryKey: productFavoritesQueryKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
}

export function useDeleteProductFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productFavoritesApi.remove(id),
    onSuccess: async () => {
      toast.success('أُزيل المنتج من المفضلة');
      await qc.invalidateQueries({ queryKey: productFavoritesQueryKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
}
