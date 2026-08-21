/**
 * Standalone launcher app: deduct warehouse stock (sale-deduct) to keep storefront
 * quantities in sync. NOT a POS — future `pos` app is separate.
 *
 * Backend catalog code: `store-stock-sync` (see store-stock-sync-app-backend-spec.md).
 */
export const STORE_STOCK_SYNC_APP_CODE = 'store-stock-sync' as const;

/** Canonical + legacy aliases the frontend still accepts during migration. */
export const STORE_STOCK_SYNC_APP_CODES = [
  STORE_STOCK_SYNC_APP_CODE,
  'store_stock_sync',
  'sale-deduct',
  'sale_deduct',
  // Legacy client-injected tile — drop from backend responses once migrated
  'pos',
  'cashier',
  'point-of-sale',
] as const;

export function normalizeApplicationCode(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-');
}

export function isStoreStockSyncApplicationCode(code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  const normalized = normalizeApplicationCode(code);
  return STORE_STOCK_SYNC_APP_CODES.some(
    (candidate) => normalizeApplicationCode(candidate) === normalized,
  );
}
