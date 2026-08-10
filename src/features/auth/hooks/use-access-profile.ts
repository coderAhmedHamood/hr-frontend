import { useQuery } from '@tanstack/react-query';
import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { authApi } from '@/features/auth/lib/api/auth';
import type { AccessProfile } from '@/features/auth/types/access-profile';
import {
  persistDefaultCompanyId,
} from '@/features/hr/organization/lib/default-company-id';
import {
  persistCompanyThemeCssVars,
  normalizeHexColor,
} from '@/shared/company-theme';
import { setDocumentFavicon } from '@/shared/set-document-favicon';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import { DEFAULT_APP_LOGO_PATH } from '@/shared/constants/branding';

export const ACCESS_PROFILE_KEY = ['auth', 'access-profile'] as const;

function themeColorsFromProfile(profile: AccessProfile | null | undefined) {
  if (!profile?.companies?.length) {
    return { primary: null as string | null, secondary: null as string | null };
  }
  const companyId = profile.defaultCompanyId;
  const company =
    profile.companies.find((c) => c.companyId === companyId) ?? profile.companies[0] ?? null;
  return {
    primary: normalizeHexColor(company?.companyPrimaryColor),
    secondary: normalizeHexColor(company?.companySecondaryColor),
  };
}

function faviconFromProfile(profile: AccessProfile | null | undefined): string {
  if (!profile?.companies?.length) return DEFAULT_APP_LOGO_PATH;
  const companyId = profile.defaultCompanyId;
  const company =
    profile.companies.find((c) => c.companyId === companyId) ?? profile.companies[0] ?? null;
  const rawLogo = company?.companyLogoUrl?.trim();
  return rawLogo ? resolveUploadUrl(rawLogo) : DEFAULT_APP_LOGO_PATH;
}

/**
 * Soft-apply a freshly fetched profile without clobbering the user's
 * currently selected company/branch (unless that selection is no longer valid).
 */
function applyAccessProfileSoft(profile: AccessProfile) {
  const state = useAuthStore.getState();
  const keepCompany =
    state.activeCompanyId &&
    profile.companies.some((c) => c.companyId === state.activeCompanyId)
      ? state.activeCompanyId
      : profile.defaultCompanyId;
  const company = profile.companies.find((c) => c.companyId === keepCompany);
  const keepBranch =
    state.activeBranchId &&
    company?.branches.some((b) => b.branchId === state.activeBranchId)
      ? state.activeBranchId
      : (company?.branches.find((b) => b.isDefault)?.branchId ??
        profile.defaultBranchId ??
        null);

  persistDefaultCompanyId(profile.defaultCompanyId);
  persistCompanyThemeCssVars(themeColorsFromProfile(profile));
  if (typeof window !== 'undefined') {
    setDocumentFavicon(faviconFromProfile(profile));
  }

  useAuthStore.setState({
    accessProfile: profile,
    activeCompanyId: keepCompany,
    activeBranchId: keepBranch,
  });
}

export function useAccessProfile() {
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [...ACCESS_PROFILE_KEY, user?.id],
    queryFn: async () => {
      const profile = await authApi.getAccessProfile(user!.id);
      applyAccessProfileSoft(profile);
      return profile;
    },
    // Always refresh on shell mount so newly granted permissions (e.g. after
    // `system:init`) appear without forcing a logout/login cycle.
    enabled: hydrated && !!user?.id,
    staleTime: 60_000,
    refetchOnMount: 'always',
  });
}

export type { AccessProfile };
