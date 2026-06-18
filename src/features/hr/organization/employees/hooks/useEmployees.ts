'use client';

import { useQuery } from '@tanstack/react-query';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';

export function useEmployees() {
  const companyId = useDefaultCompanyId();
  return useQuery({
    queryKey: ['employees', companyId],
    queryFn: () => employeesApi.getAll({ companyId: companyId ?? undefined, limit: 500 }),

    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
