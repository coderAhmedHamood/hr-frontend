'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  createCatalogUom,
  deleteCatalogUom,
  updateCatalogUom,
} from '@/features/ecommerce/admin/catalog-uoms/lib/api/catalog-uoms';
import { catalogUomsQueryKeys } from '@/features/ecommerce/admin/catalog-uoms/hooks/query-keys';

export function useCatalogUomMutations() {
  const queryClient = useQueryClient();

  function invalidate(companyId: string) {
    void queryClient.invalidateQueries({ queryKey: ['catalog-uoms'] });
    void queryClient.invalidateQueries({ queryKey: catalogUomsQueryKeys.all(companyId) });
  }

  const create = useMutation({
    mutationFn: createCatalogUom,
    onSuccess: (_data, input) => {
      invalidate(input.companyId);
      toast.success('تمت إضافة وحدة القياس');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'catalog-uoms.create').displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; companyId: string; patch: Parameters<typeof updateCatalogUom>[1] }) =>
      updateCatalogUom(id, patch),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم تحديث وحدة القياس');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'catalog-uoms.update').displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string; companyId: string }) => deleteCatalogUom(id),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم حذف وحدة القياس');
    },
    onError: (err) => {
      toast.error(handleApiError(err, 'catalog-uoms.delete').displayMessage);
    },
  });

  return { create, update, remove };
}
