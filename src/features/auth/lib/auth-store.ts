import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AccessProfile } from '@/features/auth/types/access-profile';
import type { AuthUser } from '@/features/auth/types/access-profile';
import {
  clearDefaultCompanyId,
  persistDefaultCompanyId,
} from '@/features/hr/organization/lib/default-company-id';
import {
  clearPersistedCompanyThemeCssVars,
  normalizeHexColor,
  persistCompanyThemeCssVars,
} from '@/shared/company-theme';
import { DEFAULT_APP_LOGO_PATH } from '@/shared/constants/branding';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import { setDocumentFavicon } from '@/shared/set-document-favicon';

function faviconFromProfile(profile: AccessProfile | null | undefined): string {
  if (!profile?.companies?.length) return DEFAULT_APP_LOGO_PATH;
  const companyId = profile.defaultCompanyId;
  const company =
    profile.companies.find((c) => c.companyId === companyId) ?? profile.companies[0] ?? null;
  const rawLogo = company?.companyLogoUrl?.trim();
  return rawLogo ? resolveUploadUrl(rawLogo) : DEFAULT_APP_LOGO_PATH;
}

function syncFaviconFromProfile(profile: AccessProfile | null | undefined): void {
  if (typeof window === 'undefined') return;
  setDocumentFavicon(faviconFromProfile(profile));
}

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

interface AuthState {
  user: AuthUser | null;
  accessProfile: AccessProfile | null;
  activeCompanyId: string | null;
  activeBranchId: string | null;

  setUser: (user: AuthUser) => void;
  setAccessProfile: (profile: AccessProfile) => void;
  setActiveContext: (companyId: string, branchId?: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessProfile: null,
      activeCompanyId: null,
      activeBranchId: null,

      setUser: (user) => set({ user }),

      setAccessProfile: (profile) => {
        persistDefaultCompanyId(profile.defaultCompanyId);
        persistCompanyThemeCssVars(themeColorsFromProfile(profile));
        syncFaviconFromProfile(profile);
        return set({
          accessProfile: profile,
          activeCompanyId: profile.defaultCompanyId,
          activeBranchId: profile.defaultBranchId,
        });
      },

      setActiveContext: (companyId, branchId = null) =>
        set({ activeCompanyId: companyId, activeBranchId: branchId }),

      clear: () => {
        clearDefaultCompanyId();
        clearPersistedCompanyThemeCssVars();
        syncFaviconFromProfile(null);
        set({
          user: null,
          accessProfile: null,
          activeCompanyId: null,
          activeBranchId: null,
        });
      },
    }),
    {
      name: 'rose-hr-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the data fields, not the action functions
      partialize: (state) => ({
        user: state.user,
        accessProfile: state.accessProfile,
        activeCompanyId: state.activeCompanyId,
        activeBranchId: state.activeBranchId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessProfile?.defaultCompanyId) {
          persistDefaultCompanyId(state.accessProfile.defaultCompanyId);
        }
        if (state?.accessProfile) {
          persistCompanyThemeCssVars(themeColorsFromProfile(state.accessProfile));
          syncFaviconFromProfile(state.accessProfile);
        }
      },
    },
  ),
);
