import { isMultiLangEnabled } from '@/i18n/locale-flags';
import { getPathname } from '@/i18n/navigation';
import type { StorefrontLocale } from '@/i18n/routing';

type StoreHref = Parameters<typeof getPathname>[0]['href'];

/**
 * Absolute storefront home for ERP `next/link` / `<a href>` (no intl prefixing).
 * Arabic-only mode: `/store`. Multilang: `/ar/store`.
 */
export function storefrontPublicHomeHref(): string {
  return isMultiLangEnabled ? '/ar/store' : '/store';
}

/** Builds a locale-prefixed storefront path (e.g. `/ar/store/products`). */
export function localizedStorePath(locale: StorefrontLocale, href: StoreHref): string {
  return getPathname({ locale, href });
}
