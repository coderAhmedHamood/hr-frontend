import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { companyIsSuperuser } from '@/features/auth/types/access-profile';

export function useCan() {
  const { accessProfile, activeCompanyId, activeBranchId } = useAuthStore();

  // Stable function identity across renders — callers rely on this reference
  // staying the same when nothing permission-relevant changed (e.g. as a
  // `useMemo`/`useEffect` dependency). Recreating `can` every render used to
  // cascade into an infinite fetch loop in useUnifiedNotificationTabs.
  return React.useCallback(
    (permissionCode: string): boolean => {
      if (!accessProfile || !activeCompanyId) return false;

      const company = accessProfile.companies.find((c) => c.companyId === activeCompanyId);
      if (!company) return false;
      if (companyIsSuperuser(company)) return true;

      if (activeBranchId) {
        const branch = company.branches.find((b) => b.branchId === activeBranchId);
        if (branch?.deniedPermissions.includes(permissionCode)) return false;
        if (company.deniedPermissions.includes(permissionCode)) return false;
        return (
          branch?.permissions.includes(permissionCode) ||
          company.permissions.includes(permissionCode) ||
          false
        );
      }

      if (company.deniedPermissions.includes(permissionCode)) return false;
      return company.permissions.includes(permissionCode);
    },
    [accessProfile, activeCompanyId, activeBranchId],
  );
}
