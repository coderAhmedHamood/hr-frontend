import {
  isStoreStockSyncApplicationCode,
  STORE_STOCK_SYNC_APP_CODES,
} from '@/features/inventory/admin/constants/store-stock-sync-app';

export type RoleAccess = {
  roleId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  /**
   * Inventory roles: when true, user sees all company warehouses (incl. central).
   * Absent / false → scoped to `user_branches` only.
   */
  isAllBranches?: boolean;
};

export type BranchAccess = {
  branchId: string;
  branchNameAr?: string;
  branchNameEn?: string | null;
  isDefault?: boolean;
  roles?: RoleAccess[];
  permissions: string[];
  deniedPermissions: string[];
};

export type CompanyAccess = {
  companyId: string;
  companyNameAr?: string;
  companyNameEn?: string | null;
  companyLogoUrl?: string | null;
  companyCommercialRegistrationNo?: string | null;
  companyPrimaryColor?: string | null;
  companySecondaryColor?: string | null;
  isDefault?: boolean;
  roles?: RoleAccess[];
  permissions: string[];
  deniedPermissions: string[];
  branches: BranchAccess[];
  /** True when this user is a company Superuser (not System Owner). */
  isCompanySuperuser?: boolean;
  /** Application codes enabled for this company, e.g. ["system", "inventory"]. */
  enabledApplicationCodes?: string[];
};

export type AccessProfile = {
  userId: string;
  email?: string | null;
  phone?: string | null;
  defaultCompanyId: string | null;
  defaultBranchId: string | null;
  companies: CompanyAccess[];
  /** True when userType = platform_admin. Grants /system-owner. */
  isSystemOwner?: boolean;
  /** Default console after login when no `returnTo`, e.g. `system_owner`. */
  homeConsole?: string | null;
};

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  avatarUrl?: string | null;
  userType?: string | null;
  positionAr?: string | null;
};

/** Branch visibility for inventory warehouse APIs (permissions still gate CRUD). */
export type InventoryBranchScope = {
  hasAllBranchAccess: boolean;
  allowedBranchIds: string[];
  defaultBranchId: string | null;
};

/**
 * Truthy `isAllBranches` from access-profile (boolean or loose API shapes).
 */
export function roleGrantsAllBranches(role: RoleAccess | null | undefined): boolean {
  if (!role) return false;
  const value = role.isAllBranches as unknown;
  return value === true || value === 1 || value === 'true' || value === '1';
}

/**
 * Resolve where the user may see warehouses for a company.
 * Permissions (`inv.*`) remain separate — this is branch scope only.
 *
 * Data source: `POST /auth/access-profile` → `companies[]` for the active company
 * (`roles[].isAllBranches` and, as fallback, `branches[].roles[].isAllBranches`).
 * Toggling the switch on the Roles page only updates the role entity; this flag
 * appears here after the profile is refreshed and the role is assigned to the user.
 */
export function resolveInventoryBranchScope(
  company: CompanyAccess | null | undefined,
): InventoryBranchScope {
  if (!company) {
    return { hasAllBranchAccess: false, allowedBranchIds: [], defaultBranchId: null };
  }
  const companyRoles = company.roles ?? [];
  const branchRoles = (company.branches ?? []).flatMap((b) => b.roles ?? []);
  const hasAll = [...companyRoles, ...branchRoles].some(roleGrantsAllBranches);
  const allowedBranchIds = hasAll
    ? []
    : (company.branches ?? []).map((b) => b.branchId).filter(Boolean);
  const defaultBranch =
    company.branches.find((b) => b.isDefault)?.branchId
    ?? company.branches[0]?.branchId
    ?? null;
  return {
    hasAllBranchAccess: hasAll,
    allowedBranchIds,
    defaultBranchId: defaultBranch,
  };
}

/** Primary role label for the active company (Arabic). */
export function getActiveRoleLabel(
  profile: AccessProfile | null,
  companyId: string | null,
): string | null {
  if (!profile || !companyId) return null;
  const company = profile.companies.find((c) => c.companyId === companyId);
  return company?.roles?.[0]?.nameAr ?? null;
}

export function getCompanyAccessLabel(company: CompanyAccess): string {
  return (
    company.companyNameAr?.trim()
    || company.companyNameEn?.trim()
    || company.roles?.[0]?.nameAr
    || company.companyId.slice(0, 8)
  );
}

export function getBranchAccessLabel(branch: BranchAccess): string {
  return (
    branch.branchNameAr?.trim()
    || branch.branchNameEn?.trim()
    || branch.branchId.slice(0, 8)
  );
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 1 || value === 'true' || value === '1';
}

/** Platform admin — only these users may open `/system-owner`. */
export function profileIsSystemOwner(
  profile: AccessProfile | null | undefined,
  userType?: string | null,
): boolean {
  if (isTruthyFlag(profile?.isSystemOwner)) return true;
  return (userType ?? '').trim().toLowerCase() === 'platform_admin';
}

export function findCompanyAccess(
  profile: AccessProfile | null | undefined,
  companyId: string | null | undefined,
): CompanyAccess | null {
  if (!profile || !companyId) return null;
  return profile.companies.find((c) => c.companyId === companyId) ?? null;
}

export function companyIsSuperuser(company: CompanyAccess | null | undefined): boolean {
  return isTruthyFlag(company?.isCompanySuperuser);
}

export function normalizeApplicationCode(code: string | null | undefined): string {
  return (code ?? '').trim().toLowerCase();
}

export function companyEnabledApplicationCodes(
  company: CompanyAccess | null | undefined,
): string[] {
  return (company?.enabledApplicationCodes ?? [])
    .map(normalizeApplicationCode)
    .filter(Boolean);
}

/**
 * Whether an application code is enabled on the company.
 * Missing `enabledApplicationCodes` → treat as all enabled (pre-migration sessions).
 */
export function companyHasApplicationEnabled(
  company: CompanyAccess | null | undefined,
  applicationCode: string,
): boolean {
  const codes = company?.enabledApplicationCodes;
  if (!codes || codes.length === 0) return true;
  const wanted = normalizeApplicationCode(applicationCode);
  const enabled = new Set(codes.map(normalizeApplicationCode));
  if (enabled.has(wanted)) return true;
  if (wanted === 'ecommerce' || wanted === 'store-admin' || wanted === 'storeadmin') {
    return enabled.has('ecommerce') || enabled.has('store-admin') || enabled.has('storeadmin');
  }
  if (wanted === 'contacts' || wanted === 'partners') {
    return enabled.has('contacts') || enabled.has('partners');
  }
  if (isStoreStockSyncApplicationCode(wanted)) {
    return STORE_STOCK_SYNC_APP_CODES.some((code) => enabled.has(normalizeApplicationCode(code)));
  }
  return false;
}
