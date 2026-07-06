import { useAuthStore } from '@/features/auth/lib/auth-store';

/**
 * Page-level access gate: does the user hold this permission anywhere in the
 * active company (company level OR any branch under it)? Ignores
 * `activeBranchId` — switching branch in the topbar must never lock a page
 * the user otherwise has access to.
 *
 * Use this only for page gating (ForbiddenState / route content). For
 * branch-scoped actions (create/update/delete in the current branch) and
 * filter availability, use `useCan()` instead.
 */
export function usePageAccess(permissionCode: string): boolean {
  const { accessProfile, activeCompanyId } = useAuthStore();

  if (!accessProfile || !activeCompanyId) return false;

  const company = accessProfile.companies.find((c) => c.companyId === activeCompanyId);
  if (!company) return false;

  if (company.deniedPermissions.includes(permissionCode)) return false;
  if (company.permissions.includes(permissionCode)) return true;

  return company.branches.some(
    (branch) =>
      !branch.deniedPermissions.includes(permissionCode) &&
      branch.permissions.includes(permissionCode),
  );
}
