/**
 * Dev testing switch: when true, store routes fetch APIs in the browser
 * (visible in DevTools Network) instead of during SSR.
 *
 * Set `NEXT_PUBLIC_STOREFRONT_CSR=true` in `.env` and restart Next.js.
 * Leave unset/false for normal SSR storefront.
 */
export function isStorefrontCsrEnabled(): boolean {
  const value = process.env.NEXT_PUBLIC_STOREFRONT_CSR?.trim().toLowerCase();
  return value === 'true' || value === '1';
}
