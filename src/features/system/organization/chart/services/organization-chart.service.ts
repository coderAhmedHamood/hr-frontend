import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import type { DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';

export type OrganizationChartData = {
  companies: CompanyResponseDto[];
  branches: BranchResponseDto[];
  departments: DepartmentResponseDto[];
};

export async function loadOrganizationChartData(): Promise<OrganizationChartData> {
  const companyId = getDefaultCompanyId();
  if (!companyId) {
    return { companies: [], branches: [], departments: [] };
  }

  const [company, branchesRes, departmentsRes] = await Promise.all([
    companiesApi.getById(companyId).catch(() => null),
    branchesApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() }),
    departmentsApi.getAll({ companyId, limit: 200, ...organizationActiveListStatusQuery() }),
  ]);

  return {
    companies: company ? [company] : [],
    branches: branchesRes.items,
    departments: departmentsRes.items,
  };
}
