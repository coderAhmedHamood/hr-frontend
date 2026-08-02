import { getPathname } from '@/i18n/navigation';
import type { StorefrontLocale } from '@/i18n/routing';

type StoreHref = Parameters<typeof getPathname>[0]['href'];

/** Builds a locale-prefixed storefront path (e.g. `/ar/store/products`). */
export function localizedStorePath(locale: StorefrontLocale, href: StoreHref): string {
  return getPathname({ locale, href });
}
