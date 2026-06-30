'use client';

import { useQuery } from '@tanstack/react-query';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';

export function useActiveCompany() {
  const companyId = useDefaultCompanyId();
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesApi.getById(companyId!),
    enabled: !!companyId,
    staleTime: 60_000,
    gcTime: Infinity,
  });
}

/** Alias for pages scoped to the logged-in user's default company. */
export const useDefaultCompany = useActiveCompany;
