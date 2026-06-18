import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { employeeContractsApi } from '@/features/hr/contracts/lib/contracts-api';
import { mapEmployeeContractFromApi, type HRContractRecord } from '@/features/hr/contracts/lib/contracts-store';

const PAGE_SIZE = 200;

export type FetchEmployeeContractsParams = {
  employeeId?: string;
  status?: string;
  contractNature?: string;
};

/** Loads every page from GET /payroll/contracts for the active company. */
export async function fetchAllEmployeeContracts(
  params?: FetchEmployeeContractsParams,
): Promise<HRContractRecord[]> {
  const companyId = getDefaultCompanyId();
  if (!companyId) return [];

  const first = ensurePaginatedResult(
    await employeeContractsApi.list({
      companyId,
      page: 1,
      limit: PAGE_SIZE,
      ...params,
    }),
  );

  const items = [...first.items];
  const totalPages = Math.max(first.pagination?.totalPages ?? 1, 1);

  for (let page = 2; page <= totalPages; page += 1) {
    const next = ensurePaginatedResult(
      await employeeContractsApi.list({
        companyId,
        page,
        limit: PAGE_SIZE,
        ...params,
      }),
    );
    items.push(...next.items);
  }

  return items.map(mapEmployeeContractFromApi);
}
