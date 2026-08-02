'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import { productsQueryKeys } from '@/features/ecommerce/admin/products/hooks/query-keys';
import type { CreateProductInput, UpdateProductInput } from '@/features/ecommerce/domain/types/product';

export function useProductMutations() {
  const queryClient = useQueryClient();

  function invalidateProducts(companyId: string) {
    void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all(companyId) });
  }

  const create = useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.create(input),
    onSuccess: (_data, input) => {
      invalidateProducts(input.companyId);
      toast.success('تم إضافة المنتج بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.products.create');
      toast.error(displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({ companyId, id, patch }: { companyId: string; id: string; patch: UpdateProductInput }) =>
      productsApi.update(companyId, id, patch),
    onSuccess: (_data, variables) => {
      invalidateProducts(variables.companyId);
      toast.success('تم تحديث المنتج بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.products.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) => productsApi.remove(companyId, id),
    onSuccess: (_data, variables) => {
      invalidateProducts(variables.companyId);
      toast.success('تم حذف المنتج بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.products.delete');
      toast.error(displayMessage);
    },
  });

  return { create, update, remove };
}
