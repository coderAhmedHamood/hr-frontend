import type {
  StorefrontCategory,
  StorefrontCompanyConfig,
  StorefrontFaqItem,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { localizedStorePath } from '@/features/ecommerce/storefront/lib/store-paths';
import { publicConfig } from '@/shared/config';
import type { StorefrontLocale } from '@/i18n/routing';

const SITE_URL = publicConfig.siteUrl.replace(/\/$/, '');

export function absoluteUrl(path: string): string {
  return SITE_URL ? `${SITE_URL}${path}` : path;
}

export function productJsonLd(
  product: StorefrontProduct,
  category: StorefrontCategory | null,
  locale: StorefrontLocale,
) {
  const href = `/store/products/${product.slug}` as const;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.media.map((item) => item.url),
    category: category?.name,
    inLanguage: locale,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(localizedStorePath(locale, href)),
      priceCurrency: product.price.currency,
      price: product.price.amount,
      availability:
        product.stockStatus === 'in_stock'
          ? 'https://schema.org/InStock'
          : product.stockStatus === 'preorder'
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/OutOfStock',
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: `/store${string}` }[],
  locale: StorefrontLocale,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    inLanguage: locale,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localizedStorePath(locale, item.path)),
    })),
  };
}

export function collectionPageJsonLd(
  name: string,
  href: `/store${string}`,
  locale: StorefrontLocale,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    inLanguage: locale,
    url: absoluteUrl(localizedStorePath(locale, href)),
  };
}

/** Sync + client-safe. contactType falls back to a locale string (no next-intl/server). */
export function organizationJsonLd(config: StorefrontCompanyConfig, locale: StorefrontLocale) {
  const sameAs = Object.values(config.social).filter((url): url is string => Boolean(url));
  const contactType = locale === 'ar' ? 'خدمة العملاء' : 'customer service';
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: absoluteUrl(localizedStorePath(locale, '/store')),
    inLanguage: locale,
    logo: config.logoUrl ?? undefined,
    address: config.contact.address ?? undefined,
    contactPoint: config.contact.phone || config.contact.email
      ? {
          '@type': 'ContactPoint',
          telephone: config.contact.phone,
          email: config.contact.email,
          contactType,
        }
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

export function faqJsonLd(items: StorefrontFaqItem[], locale: StorefrontLocale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function websiteJsonLd(config: StorefrontCompanyConfig, locale: StorefrontLocale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.name,
    url: absoluteUrl(localizedStorePath(locale, '/store')),
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: absoluteUrl(localizedStorePath(locale, '/store/search?q={search_term_string}')),
      'query-input': 'required name=search_term_string',
    },
  };
}
