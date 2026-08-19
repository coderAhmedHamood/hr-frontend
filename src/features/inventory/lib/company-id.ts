import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { INVENTORY_FALLBACK_COMPANY_ID } from '@/features/inventory/lib/company-constants';

export { INVENTORY_FALLBACK_COMPANY_ID } from '@/features/inventory/lib/company-constants';

/**
 * Tenant company id for inventory admin.
 * Prefer the authenticated default company; fall back to the seeded inventory company.
 */
export function getInventoryCompanyId(): string {
  return getDefaultCompanyId() ?? INVENTORY_FALLBACK_COMPANY_ID;
}
