'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productReviewsApi,
  type CreateProductReviewInput,
  type ProductReviewListQuery,
  type ProductReviewStatus,
  type UpdateProductReviewInput,
} from '@/features/ecommerce/admin/reviews/lib/api/product-reviews-api';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export const productReviewsQueryKeys = {
  all: ['ecommerce', 'product-reviews'] as const,
  list: (query: ProductReviewListQuery) => [...productReviewsQueryKeys.all, 'list', query] as const,
};

export function useProductReviews(query: ProductReviewListQuery) {
  return useQuery({
    queryKey: productReviewsQueryKeys.list(query),
    queryFn: () => productReviewsApi.list(query),
  });
}

export function useCreateProductReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductReviewInput) => productReviewsApi.create(input),
    onSuccess: async () => {
      toast.success('تم إنشاء التقييم');
      await qc.invalidateQueries({ queryKey: productReviewsQueryKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
}

export function useUpdateProductReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateProductReviewInput }) =>
      productReviewsApi.update(id, patch),
    onSuccess: async () => {
      toast.success('تم تحديث التقييم');
      await qc.invalidateQueries({ queryKey: productReviewsQueryKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
}

export function useDeleteProductReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productReviewsApi.remove(id),
    onSuccess: async () => {
      toast.success('تم أرشفة التقييم');
      await qc.invalidateQueries({ queryKey: productReviewsQueryKeys.all });
    },
    onError: (error) => handleApiError(error),
  });
}

export function useSetProductReviewStatus() {
  const update = useUpdateProductReview();
  return {
    ...update,
    mutate: (input: { id: string; status: ProductReviewStatus }) =>
      update.mutate({ id: input.id, patch: { status: input.status } }),
  };
}
