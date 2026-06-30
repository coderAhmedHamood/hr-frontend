import { useQuery } from '@tanstack/react-query';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { payrollListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import { allowanceTypesApi, type AllowanceTypeDto } from '../api/allowance-types';
import type { HRAllowanceTypeRecord } from '../allowance-types-store';

function mapAllowanceType(r: AllowanceTypeDto): HRAllowanceTypeRecord {
  return {
    id: r.id,
    code: r.code,
    nameAr: r.nameAr,
    nameEn: r.nameEn ?? '',
    typicalAmount: parseFloat(r.typicalAmount ?? '0') || 0,
    currency: r.currency,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    updatedAt: r.updatedAt,
  };
}

export const allowanceTypeKeys = {
  all: ['allowance-types'] as const,
  byCompany: (companyId: string) => ['allowance-types', companyId] as const,
};

export function useAllowanceTypes() {
  const companyId = getDefaultCompanyId() ?? '';
  return useQuery({
    queryKey: allowanceTypeKeys.byCompany(companyId),
    queryFn: async () => {
      const result = await allowanceTypesApi.getAll({ companyId, limit: 200, ...payrollListArchiveQuery() });
      return result.items.map(mapAllowanceType);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
