/**
 * Shop sales (`shop-sales`): deduct what a physical shop sold from a
 * warehouse so the online store shows the right quantities. Not a point of
 * sale (no payment, no receipt). An app of its own, depending on inventory
 * only; its screen is /pos.
 *
 * The store–inventory link (`store-stock-sync`) is a separate bridge app with
 * no screen of its own (its settings are in the store settings).
 */
export const SHOP_SALES_APP_CODE = 'shop-sales' as const;

/** Canonical + legacy aliases the frontend still accepts. */
export const SHOP_SALES_APP_CODES = [
  SHOP_SALES_APP_CODE,
  'sale-deduct',
  'sale_deduct',
  // Legacy client-injected tile
  'pos',
  'cashier',
  'point-of-sale',
] as const;

export function normalizeApplicationCode(code: string): string {
  return code.trim().toLowerCase().replace(/_/g, '-');
}

export function isShopSalesApplicationCode(code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  const normalized = normalizeApplicationCode(code);
  return SHOP_SALES_APP_CODES.some((candidate) => normalizeApplicationCode(candidate) === normalized);
}
