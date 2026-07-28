/**
 * Ecommerce mock data is seeded under `demo-company` only.
 * Do not use the ERP default company from localStorage — that UUID has no
 * storefront/CMS seed and causes homepage 404 / CMS load failures.
 */
export const STOREFRONT_FALLBACK_COMPANY_ID = 'demo-company';

export function getStorefrontCompanyId(): string {
  return STOREFRONT_FALLBACK_COMPANY_ID;
}
