'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { hrSettingsApi } from '@/features/hr/settings/lib/api/hr-settings';
import type { UpdateHrCompanySettingsDto } from '@/features/hr/settings/lib/api/types';

export const hrSettingsQueryKey = (companyId: string) => ['hr-settings', companyId] as const;

export function useHrCompanySettings() {
  const companyId = useDefaultCompanyId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: hrSettingsQueryKey(companyId ?? ''),
    queryFn: () => hrSettingsApi.getByCompanyId(companyId!),
    enabled: !!companyId,
  });

  const update = useMutation({
    mutationFn: (dto: UpdateHrCompanySettingsDto) => hrSettingsApi.update(companyId!, dto),
    onSuccess: (data) => {
      if (companyId) {
        queryClient.setQueryData(hrSettingsQueryKey(companyId), data);
      }
    },
  });

  return { ...query, update, companyId };
}
