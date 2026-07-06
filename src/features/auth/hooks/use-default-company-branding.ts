'use client';

import { useMemo, useState } from 'react';
import type { AccessProfile } from '@/features/auth/types/access-profile';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { normalizeHexColor, persistCompanyThemeCssVars } from '@/shared/company-theme';
import { LOGIN_BRANDING_STORAGE_KEY } from '@/shared/constants/branding';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';

type StoredLoginBranding = {
  companyLogoUrl: string | null;
  companyNameAr: string | null;
  companyNameEn: string | null;
  companyCommercialRegistrationNo: string | null;
  companyPrimaryColor: string | null;
  companySecondaryColor: string | null;
};

type CompanyBrandingSource = {
  companyLogoUrl?: string | null;
  companyNameAr?: string | null;
  companyNameEn?: string | null;
  companyCommercialRegistrationNo?: string | null;
  companyPrimaryColor?: string | null;
  companySecondaryColor?: string | null;
} | null;

function pickDefaultCompany(profile: AccessProfile) {
  const companyId = profile.defaultCompanyId;
  if (!companyId) return profile.companies.find((c) => c.isDefault) ?? profile.companies[0] ?? null;
  return profile.companies.find((c) => c.companyId === companyId) ?? null;
}

function brandingFromCompany(company: CompanyBrandingSource) {
  const rawLogo = company?.companyLogoUrl?.trim() || null;
  return {
    logoUrl: rawLogo ? resolveUploadUrl(rawLogo) : null,
    logoAlt: company?.companyNameAr?.trim() || company?.companyNameEn?.trim() || 'Rose HR',
    companyNameAr: company?.companyNameAr?.trim() || null,
    companyNameEn: company?.companyNameEn?.trim() || null,
    companyCommercialRegistrationNo: company?.companyCommercialRegistrationNo?.trim() || null,
    primaryColor: normalizeHexColor(company?.companyPrimaryColor),
    secondaryColor: normalizeHexColor(company?.companySecondaryColor),
  };
}

export function persistLoginBranding(profile: AccessProfile) {
  if (typeof window === 'undefined') return;
  const company = pickDefaultCompany(profile);
  const payload: StoredLoginBranding = {
    companyLogoUrl: company?.companyLogoUrl?.trim() || null,
    companyNameAr: company?.companyNameAr?.trim() || null,
    companyNameEn: company?.companyNameEn?.trim() || null,
    companyCommercialRegistrationNo: company?.companyCommercialRegistrationNo?.trim() || null,
    companyPrimaryColor: normalizeHexColor(company?.companyPrimaryColor),
    companySecondaryColor: normalizeHexColor(company?.companySecondaryColor),
  };
  try {
    localStorage.setItem(LOGIN_BRANDING_STORAGE_KEY, JSON.stringify(payload));
    persistCompanyThemeCssVars({
      primary: payload.companyPrimaryColor,
      secondary: payload.companySecondaryColor,
    });
  } catch {
    // ignore quota / private mode
  }
}

function readStoredLoginBranding(): StoredLoginBranding | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOGIN_BRANDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredLoginBranding;
  } catch {
    return null;
  }
}

function colorsFromDefaultCompany(
  defaultCompanyId: string | null,
  companies: AccessProfile['companies'] | undefined,
) {
  if (!defaultCompanyId || !companies?.length) {
    return { primaryColor: null as string | null, secondaryColor: null as string | null };
  }
  const company = companies.find((c) => c.companyId === defaultCompanyId) ?? null;
  return {
    primaryColor: normalizeHexColor(company?.companyPrimaryColor),
    secondaryColor: normalizeHexColor(company?.companySecondaryColor),
  };
}

export function useDefaultCompanyBranding() {
  const defaultCompanyId = useDefaultCompanyId();
  const companies = useAuthStore((s) => s.accessProfile?.companies);

  return useMemo(() => {
    const company = companies?.find((c) => c.companyId === defaultCompanyId) ?? null;
    return brandingFromCompany(company);
  }, [companies, defaultCompanyId]);
}

/** Theme colors for the active default company (session → stored login branding → defaults). */
export function useCompanyThemeColors() {
  const defaultCompanyId = useDefaultCompanyId();
  const companies = useAuthStore((s) => s.accessProfile?.companies);
  const [stored] = useState<StoredLoginBranding | null>(() => readStoredLoginBranding());

  return useMemo(() => {
    const fromSession = colorsFromDefaultCompany(defaultCompanyId, companies);
    if (fromSession.primaryColor || fromSession.secondaryColor) {
      return fromSession;
    }
    if (stored) {
      return {
        primaryColor: normalizeHexColor(stored.companyPrimaryColor),
        secondaryColor: normalizeHexColor(stored.companySecondaryColor),
      };
    }
    return { primaryColor: null, secondaryColor: null };
  }, [companies, defaultCompanyId, stored]);
}

/** Login screen — session branding, then last successful login, then empty. */
export function useLoginPageBranding() {
  const session = useDefaultCompanyBranding();
  const [stored] = useState<StoredLoginBranding | null>(() => readStoredLoginBranding());

  return useMemo(() => {
    const sessionHasBranding =
      session.logoUrl ||
      session.companyNameAr ||
      session.companyNameEn ||
      session.primaryColor ||
      session.secondaryColor;
    if (sessionHasBranding) return session;
    if (stored) return brandingFromCompany(stored);
    return brandingFromCompany(null);
  }, [session, stored]);
}

/** Keep nav branding in sync after company settings are saved. */
export function patchDefaultCompanyBrandingInSession(
  companyId: string,
  patch: {
    companyLogoUrl?: string | null;
    companyPrimaryColor?: string | null;
    companySecondaryColor?: string | null;
    companyNameAr?: string;
    companyNameEn?: string | null;
    companyCommercialRegistrationNo?: string | null;
  },
) {
  const state = useAuthStore.getState();
  const profile = state.accessProfile;
  if (!profile) return;

  const updatedCompanies = profile.companies.map((c) =>
    c.companyId === companyId ? { ...c, ...patch } : c,
  );

  useAuthStore.setState({
    accessProfile: {
      ...profile,
      companies: updatedCompanies,
    },
  });

  if (profile.defaultCompanyId === companyId) {
    persistLoginBranding({
      ...profile,
      companies: updatedCompanies,
    });
  }
}
