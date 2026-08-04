import type { CompanyConfigRecord } from '@/features/ecommerce/storefront/domain/company-config';
import type { StorefrontCompanyConfig, StorefrontNavItem } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import { resolveLocalizedText } from '@/features/ecommerce/storefront/domain/localizable';

function mapNavItem(
  item: CompanyConfigRecord['navigation'][number],
  locale: StorefrontLocale,
): StorefrontNavItem {
  return {
    label: resolveLocalizedText(item.label, locale),
    href: item.href,
  };
}

export function mapStorefrontCompanyConfig(
  record: CompanyConfigRecord,
  locale: StorefrontLocale,
): StorefrontCompanyConfig {
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
      defaultOgImage: record.seo.defaultOgImage ?? null,
    },
    contact: record.contact,
    social: record.social,
    theme: record.theme,
    navigation: record.navigation.map((item) => mapNavItem(item, locale)),
    secondaryNavigation: record.secondaryNavigation.map((item) => ({
      ...mapNavItem(item, locale),
      highlight: item.highlight,
    })),
    footer: {
      copyrightOwnerName: resolveLocalizedText(record.footer.copyrightOwnerName, locale),
      commercialRegistration: record.footer.commercialRegistration ?? null,
      linkGroups: record.footer.linkGroups.map((group) => ({
        id: group.id,
        title: resolveLocalizedText(group.title, locale),
        links: group.links.map((link) => mapNavItem(link, locale)),
      })),
    },
    currency: record.currency,
    timezone: record.timezone,
  };
}
