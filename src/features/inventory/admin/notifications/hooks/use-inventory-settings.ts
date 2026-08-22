'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import {
  inventorySettingsApi,
  type UpdateInventoryCompanySettingsDto,
} from '@/features/inventory/admin/notifications/lib/api/inventory-settings';

export const inventorySettingsQueryKey = (companyId: string) =>
  ['inventory-settings', companyId] as const;

export function useInventoryCompanySettings() {
  const companyId = getInventoryCompanyId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: inventorySettingsQueryKey(companyId),
    queryFn: () => inventorySettingsApi.getByCompanyId(companyId),
  });

  const update = useMutation({
    mutationFn: (dto: UpdateInventoryCompanySettingsDto) =>
      inventorySettingsApi.update(companyId, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(inventorySettingsQueryKey(companyId), data);
    },
  });

  return { ...query, update, companyId };
}
