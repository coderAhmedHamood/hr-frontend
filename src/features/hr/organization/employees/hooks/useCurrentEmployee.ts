'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';

export function useCurrentEmployee() {
  const userId = useAuthStore((s) => s.user?.id);
  const companyId = useDefaultCompanyId();
  return useQuery({
    queryKey: ['current-employee', userId, companyId],
    queryFn: async () => {
      // Backend only supports page/limit/companyId — filter by userId client-side
      const result = await employeesApi.getAll({ companyId: companyId ?? undefined, limit: 500 });
      return result.items.find((e) => e.userId === userId) ?? null;
    },
    enabled: !!userId && !!companyId,
    staleTime: 10 * 60 * 1000,
  });
}
