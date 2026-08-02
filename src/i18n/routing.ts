import { defineRouting } from 'next-intl/routing';

/** Storefront locales — website-only; ERP routes are not locale-prefixed. */
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
});

export type StorefrontLocale = (typeof routing.locales)[number];

export function isRtlLocale(locale: string): boolean {
  return locale === 'ar';
}
