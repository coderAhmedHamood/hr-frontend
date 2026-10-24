'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/features/hr/organization/lib/api/users';
import { organizationActiveListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import type { UserPickerOption } from '@/features/system/email/components/user-picker';

/**
 * Users of the active company, for the "اختر مستخدمين" picker — scoped
 * client-side via each user's `companies` links (the `/users` endpoint is
 * platform-wide and has no `companyId` filter, same pattern already used for
 * role assignment — see `useUsersForRole`).
 */
export function useCompanyUsersForEmail(companyId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['system-email', 'company-users', companyId],
    queryFn: () => usersApi.getAll({ limit: 500, ...organizationActiveListArchiveQuery() }),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const options: UserPickerOption[] = (query.data?.items ?? [])
    .filter((u) => u.companies.some((c) => c.companyId === companyId && c.isActive))
    .map((u) => ({
      id: u.id,
      name: u.fullNameAr || u.fullNameEn || u.email || 'بلا اسم',
      email: u.email,
    }));

  return { options, isLoading: query.isLoading };
}
