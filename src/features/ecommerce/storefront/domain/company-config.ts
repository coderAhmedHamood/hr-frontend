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

export type CompanyAnnouncementHref = `/store${string}` | '/store' | null;

/** One scrolling message inside the announcement bar. */
export type CompanyAnnouncementItemRecord = {
  id: string;
  enabled: boolean;
  message: LocalizableString;
  /** Optional storefront link when this message is clicked. */
  href: CompanyAnnouncementHref;
};

/**
 * Top-of-site announcement strip (above the header).
 * Multiple enabled messages scroll continuously (marquee).
 */
export type CompanyAnnouncementBarRecord = {
  enabled: boolean;
  items: CompanyAnnouncementItemRecord[];
  dismissible: boolean;
  /** Duration of one full marquee loop in milliseconds. */
  speedMs: number;
};

export const DEFAULT_ANNOUNCEMENT_SPEED_MS = 28_000;
export const MIN_ANNOUNCEMENT_SPEED_MS = 3_000;
export const MAX_ANNOUNCEMENT_SPEED_MS = 120_000;

export function clampAnnouncementSpeedMs(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_ANNOUNCEMENT_SPEED_MS;
  }
  return Math.min(
    MAX_ANNOUNCEMENT_SPEED_MS,
    Math.max(MIN_ANNOUNCEMENT_SPEED_MS, Math.round(value)),
  );
}

/** Legacy single-message shape — migrated via `normalizeAnnouncementBar`. */
type LegacyAnnouncementBarRecord = {
  enabled?: boolean;
  message?: LocalizableString;
  href?: CompanyAnnouncementHref;
  dismissible?: boolean;
  items?: CompanyAnnouncementItemRecord[];
  speedMs?: number;
};

export function normalizeAnnouncementBar(
  raw: LegacyAnnouncementBarRecord | CompanyAnnouncementBarRecord | null | undefined,
): CompanyAnnouncementBarRecord {
  const enabled = raw?.enabled ?? false;
  const dismissible = raw?.dismissible ?? true;
  const speedMs = clampAnnouncementSpeedMs(
    (raw as LegacyAnnouncementBarRecord | undefined)?.speedMs,
  );

  if (raw?.items && Array.isArray(raw.items)) {
    return {
      enabled,
      dismissible,
      speedMs,
      items: raw.items.map((item, index) => ({
        id: item.id || `announcement-${index + 1}`,
        enabled: item.enabled !== false,
        message: {
          ar: item.message?.ar ?? '',
          en: item.message?.en ?? '',
        },
        href: item.href ?? null,
      })),
    };
  }

  const legacy = raw as LegacyAnnouncementBarRecord;
  const message = legacy.message ?? { ar: '', en: '' };
  const hasText = Boolean(message.ar?.trim() || message.en?.trim());

  return {
    enabled,
    dismissible,
    speedMs,
    items: hasText
      ? [
          {
            id: 'legacy-announcement-1',
            enabled: true,
            message: { ar: message.ar ?? '', en: message.en ?? '' },
            href: legacy.href ?? null,
          },
        ]
      : [],
  };
}

export type CompanyCheckoutPaymentMethod = 'cash_on_delivery' | 'card';

/** Checkout / shipping rules edited in Website Settings. */
export type CompanyCheckoutConfigRecord = {
  cities: string[];
  defaultCity: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  paymentMethods: CompanyCheckoutPaymentMethod[];
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
  announcement: CompanyAnnouncementBarRecord;
  checkout: CompanyCheckoutConfigRecord;
  defaultLocale: string;
  currency: string;
  timezone: string;
};

/** @deprecated Use StorefrontCompanyConfig from domain/storefront-models.ts in UI. */
export type CompanyConfig = CompanyConfigRecord;
