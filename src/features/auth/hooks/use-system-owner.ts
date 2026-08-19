'use client';

import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  companyIsSuperuser,
  findCompanyAccess,
  profileIsSystemOwner,
} from '@/features/auth/types/access-profile';

export function useIsSystemOwner(): boolean {
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const userType = useAuthStore((s) => s.user?.userType);
  return profileIsSystemOwner(accessProfile, userType);
}

export function useIsCompanySuperuser(): boolean {
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  return companyIsSuperuser(findCompanyAccess(accessProfile, activeCompanyId));
}

export function useModuleEnablementContext() {
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const userType = useAuthStore((s) => s.user?.userType);
  const company = findCompanyAccess(accessProfile, activeCompanyId);
  return {
    companyId: activeCompanyId,
    isSystemOwner: profileIsSystemOwner(accessProfile, userType),
    enabledApplicationCodes: company?.enabledApplicationCodes ?? null,
  };
}
