export type RoleAccess = {
  roleId: string;
  code: string;
  nameAr: string;
  nameEn: string;
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
};

export type AccessProfile = {
  userId: string;
  email?: string | null;
  phone?: string | null;
  defaultCompanyId: string | null;
  defaultBranchId: string | null;
  companies: CompanyAccess[];
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
