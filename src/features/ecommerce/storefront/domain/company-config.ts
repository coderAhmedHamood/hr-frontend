import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';

export type CompanyThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
};

export type CompanySeoDefaultsRecord = {
  homeTitle: LocalizableString;
  homeDescription: LocalizableString;
  productsTitle: LocalizableString;
  productsDescription: LocalizableString;
  defaultOgImage?: string;
};

export type CompanyContactInfo = {
  phone?: string;
  email?: string;
  address?: string;
};

export type CompanySocialLinks = {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  whatsapp?: string;
};

export type CompanyNavItemRecord = {
  label: LocalizableString;
  href: `/store${string}` | '/store';
};

export type CompanyFooterLinkGroupRecord = {
  id: string;
  title: LocalizableString;
  links: CompanyNavItemRecord[];
};

export type CompanyFooterConfigRecord = {
  copyrightOwnerName: LocalizableString;
  linkGroups: CompanyFooterLinkGroupRecord[];
  /** Commercial registration (CR) — edited under Website Settings, shown in footer copyright line. */
  commercialRegistration?: string;
};

export type CompanySecondaryNavItemRecord = CompanyNavItemRecord & {
  highlight?: boolean;
};

/** Raw CMS company config — bilingual fields resolved at repository boundary. */
export type CompanyConfigRecord = {
  id: string;
  name: LocalizableString;
  logoUrl: string | null;
  faviconUrl: string | null;
  seo: CompanySeoDefaultsRecord;
  contact: CompanyContactInfo;
  social: CompanySocialLinks;
  theme: CompanyThemeColors;
  navigation: CompanyNavItemRecord[];
  secondaryNavigation: CompanySecondaryNavItemRecord[];
  footer: CompanyFooterConfigRecord;
  defaultLocale: string;
  currency: string;
  timezone: string;
};

/** @deprecated Use StorefrontCompanyConfig from domain/storefront-models.ts in UI. */
export type CompanyConfig = CompanyConfigRecord;
