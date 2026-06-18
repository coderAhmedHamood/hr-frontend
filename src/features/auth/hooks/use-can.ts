import { useAuthStore } from '@/features/auth/lib/auth-store';

export function useCan() {
  const { accessProfile, activeCompanyId, activeBranchId } = useAuthStore();

  return function can(permissionCode: string): boolean {
    if (!accessProfile || !activeCompanyId) return false;

    const company = accessProfile.companies.find((c) => c.companyId === activeCompanyId);
    if (!company) return false;

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
  };
}
