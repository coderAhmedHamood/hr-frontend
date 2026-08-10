'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
import { warehouseLocationsQueryKeys } from '@/features/inventory/admin/hooks/query-keys';
import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
} from '@/features/inventory/domain/types/warehouse';

export function useWarehouseLocationMutations() {
  const queryClient = useQueryClient();

  function invalidate(companyId: string) {
    void queryClient.invalidateQueries({
      queryKey: warehouseLocationsQueryKeys.all(companyId),
    });
  }

  const create = useMutation({
    mutationFn: (input: CreateWarehouseLocationInput) => warehouseLocationsApi.create(input),
    onSuccess: (_data, input) => {
      invalidate(input.companyId);
      toast.success('تم إضافة الموقع بنجاح');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.warehouseLocations.create');
    },
  });

  const update = useMutation({
    mutationFn: ({
      companyId,
      id,
      patch,
    }: {
      companyId: string;
      id: string;
      patch: UpdateWarehouseLocationInput;
    }) => warehouseLocationsApi.update(companyId, id, patch),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم تحديث الموقع بنجاح');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.warehouseLocations.update');
    },
  });

  const remove = useMutation({
    mutationFn: ({ companyId, id }: { companyId: string; id: string }) =>
      warehouseLocationsApi.remove(companyId, id),
    onSuccess: (_data, variables) => {
      invalidate(variables.companyId);
      toast.success('تم حذف الموقع بنجاح');
    },
    onError: (err) => {
      handleApiError(err, 'ecommerce.warehouseLocations.delete');
    },
  });

  return { create, update, remove };
}
