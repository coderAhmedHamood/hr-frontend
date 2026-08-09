/**
 * Set NEXT_PUBLIC_STORE_MULTILANG=false to run the dashboard and storefront in
 * Arabic-only mode: English name/slug/SEO inputs are hidden across admin forms,
 * and storefront routes drop the /ar locale prefix (see src/i18n/routing.ts).
 */
export const isMultiLangEnabled = process.env.NEXT_PUBLIC_STORE_MULTILANG !== 'false';
