import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type {
  StorefrontBlogPost,
  StorefrontBrand,
  StorefrontCategory,
  StorefrontCompanyConfig,
  StorefrontFaqItem,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { localizedStorePath } from '@/features/ecommerce/storefront/lib/store-paths';
import { publicConfig } from '@/shared/config';
import type { StorefrontLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

const SITE_URL = publicConfig.siteUrl.replace(/\/$/, '');

export function absoluteUrl(path: string): string {
  return SITE_URL ? `${SITE_URL}${path}` : path;
}

function ogLocale(locale: StorefrontLocale): string {
  return locale === 'ar' ? 'ar_SA' : 'en_US';
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

  return {
    title,
    description,
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
    alternates: localizedAlternates('/store/products', locale),
    robots: isCanonicalView ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: config.name,
      type: 'website',
      locale: ogLocale(locale),
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

export function breadcrumbJsonLd(items: { name: string; path: `/store${string}` }[], locale: StorefrontLocale) {
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

export function collectionPageJsonLd(name: string, href: `/store${string}`, locale: StorefrontLocale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    inLanguage: locale,
    url: absoluteUrl(localizedStorePath(locale, href)),
  };
}

export async function organizationJsonLd(config: StorefrontCompanyConfig, locale: StorefrontLocale) {
  const t = await getTranslations({ locale, namespace: 'storefront.seo' });
  const sameAs = Object.values(config.social).filter((url): url is string => Boolean(url));
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
          contactType: t('contactType'),
        }
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
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

export async function blogMetadata(config: StorefrontCompanyConfig, locale: StorefrontLocale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'storefront' });
  return basePageMetadata(config, locale, t('blog.title'), t('seo.blogDescription'), '/store/blog');
}

export function blogPostMetadata(post: StorefrontBlogPost, config: StorefrontCompanyConfig, locale: StorefrontLocale): Metadata {
  const title = `${post.metaTitle} | ${config.name}`.slice(0, 60);
  const description = post.metaDescription.slice(0, 160);
  const href = `/store/blog/${post.slug}` as const;
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
      type: 'article',
      locale: ogLocale(locale),
      publishedTime: post.publishedAt,
      authors: [post.authorName],
    },
    twitter: { card: 'summary', title, description },
  };
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

export function articleJsonLd(post: StorefrontBlogPost, config: StorefrontCompanyConfig, locale: StorefrontLocale) {
  const href = `/store/blog/${post.slug}` as const;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    inLanguage: locale,
    image: post.coverImageUrl ?? undefined,
    author: { '@type': 'Person', name: post.authorName },
    publisher: {
      '@type': 'Organization',
      name: config.name,
      logo: config.logoUrl ? { '@type': 'ImageObject', url: config.logoUrl } : undefined,
    },
    url: absoluteUrl(localizedStorePath(locale, href)),
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
