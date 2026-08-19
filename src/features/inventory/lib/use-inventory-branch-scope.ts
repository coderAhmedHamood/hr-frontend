'use client';

import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  resolveInventoryBranchScope,
  type InventoryBranchScope,
} from '@/features/auth/types/access-profile';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';

export type { InventoryBranchScope };

/** Active company's inventory branch scope from the access profile. */
export function useInventoryBranchScope(): InventoryBranchScope & {
  companyId: string;
  activeBranchId: string | null;
} {
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const companyId = activeCompanyId || getInventoryCompanyId();
  const company = accessProfile?.companies.find((c) => c.companyId === companyId) ?? null;
  const scope = resolveInventoryBranchScope(company);

  return {
    ...scope,
    companyId,
    activeBranchId:
      activeBranchId
      && (scope.hasAllBranchAccess || scope.allowedBranchIds.includes(activeBranchId))
        ? activeBranchId
        : scope.defaultBranchId,
  };
}
