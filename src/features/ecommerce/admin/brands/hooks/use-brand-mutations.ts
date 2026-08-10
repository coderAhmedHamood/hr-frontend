'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { brandsApi } from '@/features/ecommerce/admin/brands/lib/api/brands';
import { brandsQueryKeys } from '@/features/ecommerce/admin/brands/hooks/query-keys';
import type { CreateBrandInput, UpdateBrandInput } from '@/features/ecommerce/domain/types/brand';

export function useBrandMutations() {
  const queryClient = useQueryClient();

  function invalidateBrands(companyId: string) {
    void queryClient.invalidateQueries({ queryKey: brandsQueryKeys.all(companyId) });
  }

  const create = useMutation({
    mutationFn: (input: CreateBrandInput) => brandsApi.create(input),
    onSuccess: (_data, input) => {
      invalidateBrands(input.companyId);
      toast.success('تم إضافة العلامة التجارية بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.brands.create');
      toast.error(displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({ companyId, id, patch }: { companyId: string; id: string; patch: UpdateBrandInput }) =>
      brandsApi.update(companyId, id, patch),
    onSuccess: (_data, variables) => {
      invalidateBrands(variables.companyId);
      toast.success('تم تحديث العلامة التجارية بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.brands.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) => brandsApi.remove(companyId, id),
    onSuccess: (_data, variables) => {
      invalidateBrands(variables.companyId);
      toast.success('تم حذف العلامة التجارية بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.brands.delete');
      toast.error(displayMessage);
    },
  });

  return { create, update, remove };
}
