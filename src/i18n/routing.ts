import { defineRouting } from 'next-intl/routing';
import { isMultiLangEnabled } from '@/i18n/locale-flags';

/**
 * Storefront locales — website-only; ERP routes are not locale-prefixed.
 * In Arabic-only mode (NEXT_PUBLIC_STORE_MULTILANG=false) there is only one
 * locale, so no /ar prefix is added to storefront routes either.
 */
export const routing = defineRouting({
  locales: isMultiLangEnabled ? ['ar', 'en'] : ['ar'],
  defaultLocale: 'ar',
  localePrefix: isMultiLangEnabled ? 'always' : 'never',
});

export type StorefrontLocale = (typeof routing.locales)[number];

export function isRtlLocale(locale: string): boolean {
  return locale === 'ar';
}
