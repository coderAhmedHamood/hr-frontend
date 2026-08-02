'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { categoriesApi } from '@/features/ecommerce/admin/categories/lib/api/categories';
import { categoriesQueryKeys } from '@/features/ecommerce/admin/categories/hooks/query-keys';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/features/ecommerce/domain/types/category';

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  function invalidate(companyId: string) {
    void queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all(companyId) });
  }

  const create = useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: (_data, input) => {
      invalidate(input.companyId);
      toast.success('تم إضافة التصنيف بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.categories.create');
      toast.error(displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({ companyId, id, patch }: { companyId: string; id: string; patch: UpdateCategoryInput }) =>
      categoriesApi.update(companyId, id, patch),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم تحديث التصنيف بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.categories.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) => categoriesApi.remove(companyId, id),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم حذف التصنيف بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.categories.delete');
      toast.error(displayMessage);
    },
  });

  return { create, update, remove };
}
