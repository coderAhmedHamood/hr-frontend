'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { organizationSettingsApi } from '@/features/hr/organization/pages/organization/lib/api/organization-settings';
import type { UpdateOrganizationCompanySettingsDto } from '@/features/hr/organization/pages/_shared/types/settings';

export const organizationSettingsQueryKey = (companyId: string) =>
  ['organization-settings', companyId] as const;

export function useOrganizationCompanySettings() {
  const companyId = useDefaultCompanyId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: organizationSettingsQueryKey(companyId ?? ''),
    queryFn: () => organizationSettingsApi.getByCompanyId(companyId!),
    enabled: !!companyId,
  });

  const update = useMutation({
    mutationFn: (dto: UpdateOrganizationCompanySettingsDto) =>
      organizationSettingsApi.update(companyId!, dto),
    onSuccess: (data) => {
      if (companyId) {
        queryClient.setQueryData(organizationSettingsQueryKey(companyId), data);
      }
    },
  });

  return { ...query, update, companyId };
}
