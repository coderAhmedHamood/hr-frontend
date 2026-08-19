import type {
  CompanyFooterLinkGroupRecord,
  CompanyNavItemRecord,
} from '@/features/ecommerce/storefront/domain/company-config';

export type StoreFooterPagePresetId =
  | 'home'
  | 'products'
  | 'categories'
  | 'about'
  | 'contact'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'returns'
  | 'offers'
  | 'wholesale';

export type StoreFooterPagePreset = {
  id: StoreFooterPagePresetId;
  href: `/store${string}` | '/store';
  label: { ar: string; en: string };
};

/** Canonical storefront pages for footer / nav link pickers. */
export const STORE_FOOTER_PAGE_PRESETS: StoreFooterPagePreset[] = [
  { id: 'home', href: '/store', label: { ar: 'الرئيسية', en: 'Home' } },
  { id: 'products', href: '/store/products', label: { ar: 'المنتجات', en: 'Products' } },
  { id: 'categories', href: '/store/categories', label: { ar: 'التصنيفات', en: 'Categories' } },
  { id: 'about', href: '/store/about', label: { ar: 'من نحن', en: 'About us' } },
  { id: 'contact', href: '/store/contact', label: { ar: 'تواصل', en: 'Contact' } },
  { id: 'faq', href: '/store/faq', label: { ar: 'الأسئلة الشائعة', en: 'FAQ' } },
  { id: 'privacy', href: '/store/legal/privacy', label: { ar: 'الخصوصية', en: 'Privacy' } },
  { id: 'terms', href: '/store/legal/terms', label: { ar: 'الشروط', en: 'Terms' } },
  { id: 'returns', href: '/store/legal/returns', label: { ar: 'الإرجاع', en: 'Returns' } },
  { id: 'offers', href: '/store/offers', label: { ar: 'منطقة العروض', en: 'Offers' } },
  {
    id: 'wholesale',
    href: '/store/wholesale',
    label: { ar: 'أسعار الجملة', en: 'Wholesale' },
  },
];

export function findFooterPagePresetByHref(
  href: string,
): StoreFooterPagePreset | undefined {
  const normalized = href.trim().replace(/\/$/, '') || '/store';
  return STORE_FOOTER_PAGE_PRESETS.find(
    (preset) => (preset.href.replace(/\/$/, '') || '/store') === normalized,
  );
}

export function navItemFromPreset(preset: StoreFooterPagePreset): CompanyNavItemRecord {
  return {
    label: { ...preset.label },
    href: preset.href,
  };
}

function byId(id: StoreFooterPagePresetId): StoreFooterPagePreset {
  return STORE_FOOTER_PAGE_PRESETS.find((preset) => preset.id === id)!;
}

/**
 * Default footer columns linked to CMS content pages.
 * Stable ids so SSR / client markup stays consistent when used as fallback.
 */
export function buildDefaultStoreFooterLinkGroups(): CompanyFooterLinkGroupRecord[] {
  return [
    {
      id: 'default-footer-store',
      title: { ar: 'المتجر', en: 'Store' },
      links: (['about', 'contact', 'faq'] as const).map((id) => navItemFromPreset(byId(id))),
    },
    {
      id: 'default-footer-legal',
      title: { ar: 'قانوني', en: 'Legal' },
      links: (['privacy', 'terms', 'returns'] as const).map((id) =>
        navItemFromPreset(byId(id)),
      ),
    },
    {
      id: 'default-footer-shop',
      title: { ar: 'تسوق', en: 'Shop' },
      links: (['products', 'categories', 'offers', 'wholesale'] as const).map((id) =>
        navItemFromPreset(byId(id)),
      ),
    },
  ];
}

/** Use CMS groups when present; otherwise show default store page links. */
export function resolveFooterLinkGroups(
  groups: CompanyFooterLinkGroupRecord[] | null | undefined,
): CompanyFooterLinkGroupRecord[] {
  const hasLinks = (groups ?? []).some((group) => group.links.some((link) => link.href));
  if (hasLinks) return groups ?? [];
  return buildDefaultStoreFooterLinkGroups();
}

export function asStoreHref(value: string): `/store${string}` | '/store' {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/store') return '/store';
  if (trimmed.startsWith('/store')) return trimmed as `/store${string}`;
  if (trimmed.startsWith('/')) return `/store${trimmed}` as `/store${string}`;
  return `/store/${trimmed}` as `/store${string}`;
}
