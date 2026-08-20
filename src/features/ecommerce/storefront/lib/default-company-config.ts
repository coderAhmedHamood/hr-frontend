import {
  DEFAULT_MOBILE_TABS,
  DEFAULT_STORE_PAGES_VISIBILITY,
  type CompanyConfigRecord,
} from '@/features/ecommerce/storefront/domain/company-config';
import { DEFAULT_STOREFRONT_TYPOGRAPHY } from '@/features/ecommerce/storefront/lib/storefront-fonts';
import {
  buildDefaultStoreFooterLinkGroups,
  navItemFromPreset,
  STORE_FOOTER_PAGE_PRESETS,
  type StoreFooterPagePresetId,
} from '@/features/ecommerce/storefront/lib/store-footer-defaults';

const DEFAULT_THEME = {
  primary: '#0f766e',
  secondary: '#134e4a',
  accent: '#d97706',
};

function preset(id: StoreFooterPagePresetId) {
  return STORE_FOOTER_PAGE_PRESETS.find((entry) => entry.id === id)!;
}

/**
 * Dev-only fallback when `/public/store/companies/:id/config` is missing.
 * Production still 404s until the backend is seeded (`npm run system:init`).
 */
export function isStorefrontDevFallbackEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production'
    && process.env.STOREFRONT_DEV_FALLBACK_CONFIG !== 'false'
  );
}

/** Minimal storefront config so `/store` can render before CMS bootstrap. */
export function buildDefaultCompanyConfigRecord(companyId: string): CompanyConfigRecord {
  return {
    id: companyId,
    name: { ar: 'المتجر', en: 'Store' },
    logoUrl: null,
    faviconUrl: null,
    seo: {
      homeTitle: { ar: 'المتجر', en: 'Store' },
      homeDescription: {
        ar: 'تسوق منتجاتنا عبر الإنترنت',
        en: 'Shop our products online',
      },
      productsTitle: { ar: 'المنتجات', en: 'Products' },
      productsDescription: {
        ar: 'تصفح جميع المنتجات',
        en: 'Browse all products',
      },
      keywords: [],
    },
    contact: {},
    social: {},
    theme: DEFAULT_THEME,
    typography: { ...DEFAULT_STOREFRONT_TYPOGRAPHY },
    navigation: (['home', 'products', 'categories'] as const).map((id) =>
      navItemFromPreset(preset(id)),
    ),
    secondaryNavigation: (['offers', 'contact'] as const).map((id) => ({
      ...navItemFromPreset(preset(id)),
      highlight: id === 'offers',
    })),
    footer: {
      copyrightOwnerName: { ar: 'المتجر', en: 'Store' },
      tagline: { ar: '', en: '' },
      linkGroups: buildDefaultStoreFooterLinkGroups(),
    },
    announcement: {
      enabled: false,
      items: [],
      dismissible: true,
      scrolling: true,
      speedMs: 28_000,
    },
    storePages: { ...DEFAULT_STORE_PAGES_VISIBILITY },
    mobileTabs: DEFAULT_MOBILE_TABS.map((tab) => ({
      ...tab,
      label: { ...tab.label },
    })),
    defaultLocale: 'ar',
    currency: 'YER',
    timezone: 'Asia/Aden',
  };
}
