'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  storeSettingsApi,
  type UpdateStoreCompanySettingsDto,
} from '@/features/ecommerce/admin/notifications/lib/api/store-settings';

export const storeSettingsQueryKey = (companyId: string) =>
  ['store-settings', companyId] as const;

export function useStoreCompanySettings() {
  const companyId = getStorefrontCompanyId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: storeSettingsQueryKey(companyId),
    queryFn: () => storeSettingsApi.getByCompanyId(companyId),
    enabled: Boolean(companyId),
  });

  const update = useMutation({
    mutationFn: (dto: UpdateStoreCompanySettingsDto) =>
      storeSettingsApi.update(companyId, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(storeSettingsQueryKey(companyId), data);
    },
  });

  return { ...query, update, companyId };
}
