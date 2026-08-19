import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontCompanyConfig,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { localizedStorePath } from '@/features/ecommerce/storefront/lib/store-paths';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
} from '@/features/ecommerce/storefront/lib/seo-jsonld';
import type { StorefrontLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

export {
  absoluteUrl,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
};

function ogLocale(locale: StorefrontLocale): string {
  return locale === 'ar' ? 'ar_YE' : 'en_US';
}

function localizedAlternates(href: `/store${string}`, locale: StorefrontLocale) {
  const languages = Object.fromEntries(
    routing.locales.map((loc) => [loc, absoluteUrl(localizedStorePath(loc, href))]),
  ) as Record<StorefrontLocale, string>;

  return {
    canonical: languages[locale],
    languages,
  };
}

export function storeHomeMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Metadata {
  const title = `${config.seo.homeTitle} | ${config.name}`;
  const description = config.seo.homeDescription;
  const path = localizedStorePath(locale, '/store');
  const keywords = config.seo.keywords.filter(Boolean);

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: localizedAlternates('/store', locale),
    icons: config.faviconUrl ? { icon: config.faviconUrl } : undefined,
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: config.name,
      type: 'website',
      locale: ogLocale(locale),
      images: config.seo.defaultOgImage ? [{ url: config.seo.defaultOgImage }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export function productsBrowseMetadata(
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
  options?: { page?: number; hasFilter?: boolean },
): Metadata {
  const title = `${config.seo.productsTitle} | ${config.name}`;
  const description = config.seo.productsDescription;
  const isCanonicalView = (options?.page ?? 1) <= 1 && !options?.hasFilter;
  const path = localizedStorePath(locale, '/store/products');

  return {
    title,
    description,
    keywords: config.seo.keywords.filter(Boolean).length
      ? config.seo.keywords.filter(Boolean)
      : undefined,
    alternates: localizedAlternates('/store/products', locale),
    robots: isCanonicalView ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: config.name,
      type: 'website',
      locale: ogLocale(locale),
      images: config.seo.defaultOgImage ? [{ url: config.seo.defaultOgImage }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export function productMetadata(
  product: StorefrontProduct,
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
): Metadata {
  const title = `${product.metaTitle} | ${config.name}`.slice(0, 60);
  const description = product.metaDescription.slice(0, 160);
  const href = `/store/products/${product.slug}` as const;
  const url = absoluteUrl(localizedStorePath(locale, href));
  const image = product.imageUrl ?? config.seo.defaultOgImage;

  return {
    title,
    description,
    alternates: localizedAlternates(href, locale),
    openGraph: {
      title,
      description,
      url,
      siteName: config.name,
      type: 'website',
      locale: ogLocale(locale),
      images: image ? [{ url: image, alt: product.imageAlt }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function categoryMetadata(
  category: StorefrontCategory,
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
): Metadata {
  const title = `${category.metaTitle} | ${config.name}`.slice(0, 60);
  const description = category.metaDescription.slice(0, 160);
  const href = `/store/categories/${category.slug}` as const;
  const url = absoluteUrl(localizedStorePath(locale, href));

  return {
    title,
    description,
    alternates: localizedAlternates(href, locale),
    openGraph: {
      title,
      description,
      url,
      siteName: config.name,
      type: 'website',
      locale: ogLocale(locale),
      images: config.seo.defaultOgImage ? [{ url: config.seo.defaultOgImage }] : undefined,
    },
    twitter: { card: 'summary', title, description },
  };
}

function basePageMetadata(
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
  title: string,
  description: string,
  href: `/store${string}`,
): Metadata {
  const fullTitle = `${title} | ${config.name}`;
  const path = localizedStorePath(locale, href);

  return {
    title: fullTitle,
    description: description.slice(0, 160),
    alternates: localizedAlternates(href, locale),
    openGraph: {
      title: fullTitle,
      description: description.slice(0, 160),
      url: absoluteUrl(path),
      siteName: config.name,
      type: 'website',
      locale: ogLocale(locale),
      images: config.seo.defaultOgImage ? [{ url: config.seo.defaultOgImage }] : undefined,
    },
    twitter: { card: 'summary', title: fullTitle, description: description.slice(0, 160) },
  };
}

export function aboutMetadata(
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
  headline: string,
  intro: string,
): Metadata {
  return basePageMetadata(config, locale, headline, intro, '/store/about');
}

export function contactMetadata(
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
  headline: string,
  intro: string,
): Metadata {
  return basePageMetadata(config, locale, headline, intro, '/store/contact');
}

export async function faqMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale, title: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront.seo' });
  return basePageMetadata(config, locale, title, t('faqDescription'), '/store/faq');
}

export function legalMetadata(page: { metaTitle: string; metaDescription: string; slug: string; title: string }, config: StorefrontCompanyConfig, locale: StorefrontLocale): Metadata {
  const href = `/store/legal/${page.slug}` as `/store${string}`;
  return basePageMetadata(config, locale, page.metaTitle, page.metaDescription, href);
}

export async function brandsMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return basePageMetadata(config, locale, t('brands.title'), t('seo.brandsDescription'), '/store/brands');
}

export function brandMetadata(brand: StorefrontBrand, config: StorefrontCompanyConfig, locale: StorefrontLocale): Metadata {
  return basePageMetadata(config, locale, brand.metaTitle, brand.metaDescription, `/store/brands/${brand.slug}`);
}

export async function categoriesMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return basePageMetadata(config, locale, t('categories.title'), t('seo.categoriesDescription'), '/store/categories');
}

export async function cartMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(config, locale, t('cart.title'), t('cart.emptyDescription'), '/store/cart'),
    robots: { index: false, follow: true },
  };
}

export async function checkoutMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(config, locale, t('checkout.title'), t('checkout.description'), '/store/checkout'),
    robots: { index: false, follow: false },
  };
}

export async function storeLoginMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(config, locale, t('login.title'), t('login.formDescription'), '/store/login'),
    robots: { index: false, follow: false },
  };
}

export async function storeRegisterMetadata(
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(config, locale, t('register.title'), t('register.formDescription'), '/store/register'),
    robots: { index: false, follow: false },
  };
}

export async function storeForgotPasswordMetadata(
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(
      config,
      locale,
      t('forgotPassword.title'),
      t('forgotPassword.description'),
      '/store/forgot-password',
    ),
    robots: { index: false, follow: false },
  };
}

export async function storeAccountMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(config, locale, t('account.title'), t('account.trackDescription'), '/store/account'),
    robots: { index: false, follow: false },
  };
}

export async function myOrdersMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(config, locale, t('orders.myOrdersTitle'), t('orders.myOrdersDescription'), '/store/orders'),
    robots: { index: false, follow: false },
  };
}

export async function orderTrackingMetadata(
  config: StorefrontCompanyConfig,
  locale: StorefrontLocale,
  orderNumber: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(
      config,
      locale,
      t('orders.trackingTitle'),
      t('orders.trackingDescription', { orderNumber }),
      `/store/orders/${orderNumber}`,
    ),
    robots: { index: false, follow: false },
  };
}

export async function wishlistMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(config, locale, t('wishlist.title'), t('wishlist.emptyDescription'), '/store/wishlist'),
    robots: { index: false, follow: true },
  };
}

export async function searchMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return {
    ...basePageMetadata(config, locale, t('search.title'), t('seo.searchDescription'), '/store/search'),
    robots: { index: false, follow: true },
  };
}

