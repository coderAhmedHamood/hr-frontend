import { resolveApiBaseUrl } from '@/shared/api-base-url';
import { publicConfig } from '@/shared/config';
import { buildCompanyThemeCssVars } from '@/shared/company-theme';
import type { CompanyThemeColors } from '@/features/ecommerce/storefront/domain/company-config';
import {
  CUSTOM_STOREFRONT_FONT_ID,
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
  bodyFontUrl?: string | null;
  displayFontUrl?: string | null;
};

export type StorefrontBrandingResolved = {
  theme: CompanyThemeColors;
  /** Full HSL-channel CSS vars for the store shell (`--primary`, scale, foregrounds, …). */
  themeCssVars: Record<string, string>;
  typography: StorefrontTypography;
};

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

function resolveTypography(
  branding: PublicCompanyBranding | null,
  defaults: StorefrontTypography,
): StorefrontTypography {
  const bodyFontId = resolveStorefrontFontId(branding?.bodyFont, defaults.bodyFontId);
  const displayFontId = resolveStorefrontFontId(branding?.displayFont, defaults.displayFontId);
  const bodyFontUrl = branding?.bodyFontUrl?.trim() || null;
  const displayFontUrl = branding?.displayFontUrl?.trim() || null;

  return {
    bodyFontId:
      bodyFontId === CUSTOM_STOREFRONT_FONT_ID && !bodyFontUrl
        ? defaults.bodyFontId
        : bodyFontId,
    displayFontId:
      displayFontId === CUSTOM_STOREFRONT_FONT_ID && !displayFontUrl
        ? defaults.displayFontId
        : displayFontId,
    bodyFontUrl: bodyFontId === CUSTOM_STOREFRONT_FONT_ID ? bodyFontUrl : null,
    displayFontUrl: displayFontId === CUSTOM_STOREFRONT_FONT_ID ? displayFontUrl : null,
  };
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
  const typography = resolveTypography(branding, defaultTypography);

  if (!branding || (!branding.primaryColor && !branding.secondaryColor)) {
    return {
      theme: defaultTheme,
      themeCssVars: {
        '--primary': defaultTheme.primary,
        '--secondary': defaultTheme.secondary,
        '--accent': defaultTheme.accent,
      },
      typography,
    };
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
    themeCssVars: vars,
    typography,
  };
}
