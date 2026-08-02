import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';
import { buildCompanyThemeCssVars } from '@/shared/company-theme';
import type { CompanyThemeColors } from '@/features/ecommerce/storefront/domain/company-config';
import {
  DEFAULT_STOREFRONT_TYPOGRAPHY,
  resolveStorefrontFontId,
  type StorefrontTypography,
} from '@/features/ecommerce/storefront/lib/storefront-fonts';

type PublicCompanyBranding = {
  id: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  bodyFont?: string | null;
  displayFont?: string | null;
};

export type StorefrontBrandingResolved = {
  theme: CompanyThemeColors;
  typography: StorefrontTypography;
};

/** No-auth backend branding (admin-controlled) — falls back silently to CMS defaults. */
async function fetchPublicCompanyBranding(companyId: string): Promise<PublicCompanyBranding | null> {
  const base = resolveApiBaseUrl(publicConfig.apiUrl).replace(/\/$/, '');
  try {
    const response = await fetch(`${base}/public/companies/${companyId}/branding`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    const record = payload as { data?: PublicCompanyBranding } | PublicCompanyBranding;
    return (record as { data?: PublicCompanyBranding })?.data ?? (record as PublicCompanyBranding) ?? null;
  } catch {
    return null;
  }
}

/**
 * Storefront-only branding override — colors + fonts from the real backend.
 * Never affects the admin dashboard.
 */
export async function applyRealBrandingTheme(
  companyId: string,
  defaultTheme: CompanyThemeColors,
  defaultTypography: StorefrontTypography = DEFAULT_STOREFRONT_TYPOGRAPHY,
): Promise<StorefrontBrandingResolved> {
  const branding = await fetchPublicCompanyBranding(companyId);

  const typography: StorefrontTypography = {
    bodyFontId: resolveStorefrontFontId(
      branding?.bodyFont,
      defaultTypography.bodyFontId,
    ),
    displayFontId: resolveStorefrontFontId(
      branding?.displayFont,
      defaultTypography.displayFontId,
    ),
  };

  if (!branding || (!branding.primaryColor && !branding.secondaryColor)) {
    return { theme: defaultTheme, typography };
  }

  const vars = buildCompanyThemeCssVars({
    primary: branding.primaryColor,
    secondary: branding.secondaryColor,
  });

  return {
    theme: {
      primary: vars['--primary'] ?? defaultTheme.primary,
      secondary: vars['--secondary'] ?? defaultTheme.secondary,
      accent: vars['--accent'] ?? defaultTheme.accent,
    },
    typography,
  };
}
