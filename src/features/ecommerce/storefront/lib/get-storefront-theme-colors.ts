import type { CompanyThemeColors } from '@/features/ecommerce/storefront/domain/company-config';
import {
  DEFAULT_STOREFRONT_TYPOGRAPHY,
  type StorefrontTypography,
} from '@/features/ecommerce/storefront/lib/storefront-fonts';

export type StorefrontBrandingResolved = {
  theme: CompanyThemeColors;
  /** Full HSL-channel CSS vars for the store shell (`--primary`, scale, foregrounds, …). */
  themeCssVars: Record<string, string>;
  typography: StorefrontTypography;
};

/**
 * Resolves storefront theme CSS vars from store config theme/typography.
 * Does not call `/public/companies/:id/branding` (endpoint not available).
 */
export function applyStorefrontTheme(
  defaultTheme: CompanyThemeColors,
  defaultTypography: StorefrontTypography = DEFAULT_STOREFRONT_TYPOGRAPHY,
): StorefrontBrandingResolved {
  return {
    theme: defaultTheme,
    themeCssVars: {
      '--primary': defaultTheme.primary,
      '--secondary': defaultTheme.secondary,
      '--accent': defaultTheme.accent,
    },
    typography: defaultTypography,
  };
}

/** @deprecated Use applyStorefrontTheme — kept for existing imports. */
export async function applyRealBrandingTheme(
  _companyId: string,
  defaultTheme: CompanyThemeColors,
  defaultTypography: StorefrontTypography = DEFAULT_STOREFRONT_TYPOGRAPHY,
): Promise<StorefrontBrandingResolved> {
  return applyStorefrontTheme(defaultTheme, defaultTypography);
}
