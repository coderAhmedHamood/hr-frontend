'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { partnerCategoriesApi } from '@/features/contacts/admin/partners/lib/api/partner-categories';
import { partnerCategoriesQueryKeys } from '@/features/contacts/admin/hooks/query-keys';
import type {
  CreatePartnerCategoryInput,
  PartnerCategoryListQuery,
  UpdatePartnerCategoryInput,
} from '@/features/contacts/domain/types/partner';

export function usePartnerCategories(query: PartnerCategoryListQuery) {
  return useQuery({
    queryKey: partnerCategoriesQueryKeys.list(query),
    queryFn: () => partnerCategoriesApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}

export function usePartnerCategoryMutations(companyId: string) {
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: partnerCategoriesQueryKeys.all(companyId) });
  }

  const create = useMutation({
    mutationFn: (input: CreatePartnerCategoryInput) => partnerCategoriesApi.create(input),
    onSuccess: () => {
      invalidate();
      toast.success('تم إنشاء التصنيف');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'contacts.categories.create');
      toast.error(displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdatePartnerCategoryInput }) =>
      partnerCategoriesApi.update(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success('تم تحديث التصنيف');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'contacts.categories.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => partnerCategoriesApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('تم حذف التصنيف');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'contacts.categories.delete');
      toast.error(displayMessage);
    },
  });

  return { create, update, remove };
}
