/**
 * Prefer the logged-in default company (localStorage) when present; otherwise the
 * seeded inventory company used by backend demo data. Safe for server loaders
 * (no client-only imports).
 */
import { INVENTORY_FALLBACK_COMPANY_ID } from '@/features/inventory/lib/company-constants';

const DEFAULT_COMPANY_ID_STORAGE_KEY = 'rose-hr-default-company-id';

export function getStorefrontCompanyId(): string {
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem(DEFAULT_COMPANY_ID_STORAGE_KEY);
    if (fromStorage) return fromStorage;
  }
  return INVENTORY_FALLBACK_COMPANY_ID;
}
