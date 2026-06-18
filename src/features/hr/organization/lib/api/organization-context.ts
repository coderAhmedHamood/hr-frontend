import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

export type OrganizationScope = {
  companyId: string | null;
  branchId: string | null;
};

/** Resolves company/branch ids for create flows using the auth store (no API calls). */
export async function resolveOrganizationScope(
  hints?: Partial<OrganizationScope>,
): Promise<OrganizationScope> {
  const store = useAuthStore.getState();
  const companyId = hints?.companyId ?? getDefaultCompanyId() ?? null;
  const branchId = hints?.branchId ?? store.activeBranchId ?? null;
  return { companyId, branchId };
}
