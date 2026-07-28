import { INVENTORY_FALLBACK_COMPANY_ID } from '@/features/inventory/lib/company-constants';

/**
 * Stable tenant id for the ecommerce storefront + CMS mocks.
 * Must be a UUID — Nest inventory/HR APIs reject non-UUID `companyId` values.
 * Kept aligned with the inventory seed company so stock/products APIs match.
 */
export const STOREFRONT_FALLBACK_COMPANY_ID = INVENTORY_FALLBACK_COMPANY_ID;

/** Legacy mock slug previously used in seeds — remapped to the UUID above. */
export const LEGACY_STOREFRONT_COMPANY_ID = 'demo-company';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCompanyIdUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Normalize legacy `demo-company` (and any non-UUID) to the seeded storefront UUID. */
export function resolveStorefrontCompanyId(companyId?: string | null): string {
  if (!companyId || companyId === LEGACY_STOREFRONT_COMPANY_ID || !isCompanyIdUuid(companyId)) {
    return STOREFRONT_FALLBACK_COMPANY_ID;
  }
  return companyId;
}

export function getStorefrontCompanyId(): string {
  return STOREFRONT_FALLBACK_COMPANY_ID;
}
