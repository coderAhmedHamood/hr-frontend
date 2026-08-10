'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { warehousesApi } from '@/features/inventory/admin/warehouses/lib/api/warehouses';
import {
  warehouseLocationsQueryKeys,
  warehousesQueryKeys,
} from '@/features/inventory/admin/hooks/query-keys';
import type { CreateWarehouseInput, UpdateWarehouseInput } from '@/features/inventory/domain/types/warehouse';

export function useWarehouseMutations() {
  const queryClient = useQueryClient();

  function invalidate(companyId: string) {
    void queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all(companyId) });
    void queryClient.invalidateQueries({ queryKey: warehouseLocationsQueryKeys.all(companyId) });
  }

  const create = useMutation({
    mutationFn: (input: CreateWarehouseInput) => warehousesApi.create(input),
    onSuccess: (_data, input) => {
      invalidate(input.companyId);
      toast.success('تم إنشاء المستودع مع مواقعه التلقائية');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouses.create');
      toast.error(displayMessage);
    },
  });

  const update = useMutation({
    mutationFn: ({ companyId, id, patch }: { companyId: string; id: string; patch: UpdateWarehouseInput }) =>
      warehousesApi.update(companyId, id, patch),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم تحديث المستودع بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouses.update');
      toast.error(displayMessage);
    },
  });

  const remove = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) => warehousesApi.remove(companyId, id),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم حذف المستودع بنجاح');
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'ecommerce.warehouses.delete');
      toast.error(displayMessage);
    },
  });

  return { create, update, remove };
}
