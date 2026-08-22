'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getContactsCompanyId } from '@/features/contacts/lib/company-id';
import {
  contactsSettingsApi,
  type UpdateContactsCompanySettingsDto,
} from '@/features/contacts/admin/notifications/lib/api/contacts-settings';

export const contactsSettingsQueryKey = (companyId: string) =>
  ['contacts-settings', companyId] as const;

export function useContactsCompanySettings() {
  const companyId = getContactsCompanyId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: contactsSettingsQueryKey(companyId),
    queryFn: () => contactsSettingsApi.getByCompanyId(companyId),
    enabled: Boolean(companyId),
  });

  const update = useMutation({
    mutationFn: (dto: UpdateContactsCompanySettingsDto) =>
      contactsSettingsApi.update(companyId, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(contactsSettingsQueryKey(companyId), data);
    },
  });

  return { ...query, update, companyId };
}
