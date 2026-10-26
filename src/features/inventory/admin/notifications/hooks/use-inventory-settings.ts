'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { APP, useCompanyApps } from '@/shared/modules/company-apps';
import {
  inventorySettingsApi,
  type UpdateInventoryCompanySettingsDto,
} from '@/features/inventory/admin/notifications/lib/api/inventory-settings';

export const inventorySettingsQueryKey = (companyId: string) =>
  ['inventory-settings', companyId] as const;

/**
 * Inventory's company settings. Never asked for while inventory is not
 * enabled for the company (its API answers 403): screens of other apps mount
 * inventory dialogs (e.g. the product page) without opening them.
 */
export function useInventoryCompanySettings(options?: { enabled?: boolean }) {
  const companyId = getInventoryCompanyId();
  const queryClient = useQueryClient();
  const inventoryOn = useCompanyApps().isEnabled(APP.inventory);

  const query = useQuery({
    queryKey: inventorySettingsQueryKey(companyId),
    queryFn: () => inventorySettingsApi.getByCompanyId(companyId),
    enabled: inventoryOn && (options?.enabled ?? true),
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
