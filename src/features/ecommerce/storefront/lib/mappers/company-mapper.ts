import {
  isStoreCatalogHref,
  normalizeAnnouncementBar,
  normalizeStorePagesVisibility,
  resolveEnabledSocialLinks,
  type CompanyConfigRecord,
  type CompanyStorePagesVisibility,
} from '@/features/ecommerce/storefront/domain/company-config';
import type { StorefrontCompanyConfig, StorefrontNavItem } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import { resolveLocalizedText } from '@/features/ecommerce/storefront/domain/localizable';
import { DEFAULT_STOREFRONT_TYPOGRAPHY } from '@/features/ecommerce/storefront/lib/storefront-fonts';

function mapNavItem(
  item: CompanyConfigRecord['navigation'][number],
  locale: StorefrontLocale,
): StorefrontNavItem {
  return {
    label: resolveLocalizedText(item.label, locale),
    href: item.href,
  };
}

function isCatalogPageAllowed(href: string, storePages: CompanyStorePagesVisibility): boolean {
  if (isStoreCatalogHref(href, 'offers')) return storePages.offers;
  if (isStoreCatalogHref(href, 'wholesale')) return storePages.wholesale;
  return true;
}

export function mapStorefrontCompanyConfig(
  record: CompanyConfigRecord,
  locale: StorefrontLocale,
): StorefrontCompanyConfig {
  const storePages = normalizeStorePagesVisibility(record.storePages);

  return {
    id: record.id,
    name: resolveLocalizedText(record.name, locale),
    logoUrl: record.logoUrl,
    faviconUrl: record.faviconUrl,
    seo: {
      homeTitle: resolveLocalizedText(record.seo.homeTitle, locale),
      homeDescription: resolveLocalizedText(record.seo.homeDescription, locale),
      productsTitle: resolveLocalizedText(record.seo.productsTitle, locale),
      productsDescription: resolveLocalizedText(record.seo.productsDescription, locale),
      keywords: record.seo.keywords ?? [],
      defaultOgImage: record.seo.defaultOgImage ?? null,
    },
    contact: record.contact,
    social: resolveEnabledSocialLinks(record.social),
    theme: record.theme,
    typography: DEFAULT_STOREFRONT_TYPOGRAPHY,
    navigation: record.navigation
      .filter((item) => isCatalogPageAllowed(item.href, storePages))
      .map((item) => mapNavItem(item, locale)),
    secondaryNavigation: record.secondaryNavigation
      .filter((item) => isCatalogPageAllowed(item.href, storePages))
      .map((item) => ({
        ...mapNavItem(item, locale),
        highlight: item.highlight,
      })),
    footer: {
      copyrightOwnerName: resolveLocalizedText(record.footer.copyrightOwnerName, locale),
      commercialRegistration: record.footer.commercialRegistration ?? null,
      linkGroups: record.footer.linkGroups.map((group) => ({
        id: group.id,
        title: resolveLocalizedText(group.title, locale),
        links: group.links
          .filter((link) => isCatalogPageAllowed(link.href, storePages))
          .map((link) => mapNavItem(link, locale)),
      })),
    },
    announcement: (() => {
      const bar = normalizeAnnouncementBar(record.announcement);
      return {
        enabled: bar.enabled,
        dismissible: bar.dismissible,
        scrolling: bar.scrolling,
        speedMs: bar.speedMs,
        items: bar.items
          .filter((item) => item.enabled && (item.message.ar.trim() || item.message.en.trim()))
          .map((item) => ({
            id: item.id,
            message: resolveLocalizedText(item.message, locale),
            href: item.href,
          }))
          .filter((item) => item.message.trim()),
      };
    })(),
    checkout: {
      cities: record.checkout?.cities?.length
        ? [...record.checkout.cities]
        : [
            'صنعاء',
            'عدن',
            'تعز',
            'الحديدة',
            'إب',
            'ذمار',
            'المكلا',
            'سيئون',
            'حجة',
            'صعدة',
            'مأرب',
            'البيضاء',
            'لحج',
            'أبين',
            'الضالع',
            'شبوة',
            'المحويت',
            'عمران',
          ],
      defaultCity: record.checkout?.defaultCity || 'صنعاء',
      freeShippingThreshold: record.checkout?.freeShippingThreshold ?? 200,
      standardShippingFee: record.checkout?.standardShippingFee ?? 25,
      paymentMethods:
        record.checkout?.paymentMethods?.length > 0
          ? [...record.checkout.paymentMethods]
          : ['cash_on_delivery', 'card'],
    },
    storePages,
    currency: record.currency,
    timezone: record.timezone,
  };
}
