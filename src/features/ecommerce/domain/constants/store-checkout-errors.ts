export const STORE_COUNTRY_UNAVAILABLE_ERROR = 'COUNTRY_UNAVAILABLE';

/** Backend: `Selected country is not available for this store` */
export function isStoreCountryUnavailable(message: string | null | undefined): boolean {
  return /country is not available for this store/i.test(message ?? '');
}

/** Backend 409 `STORE_STOCK_SHORT`: the item is short (store quantity, or inventory via the bridge). */
export const STORE_STOCK_SHORT_ERROR = 'STORE_STOCK_SHORT';

export function isStoreStockShort(payload: unknown, message: string | null | undefined): boolean {
  const body = payload as { error?: { code?: unknown }; code?: unknown } | null | undefined;
  return (
    body?.error?.code === STORE_STOCK_SHORT_ERROR ||
    body?.code === STORE_STOCK_SHORT_ERROR ||
    /not enough stock/i.test(message ?? '')
  );
}

/** Backend 503 `STORE_INVENTORY_UNAVAILABLE`: inventory cannot answer; the order was not placed (phase 4). */
export const STORE_INVENTORY_UNAVAILABLE_ERROR = 'STORE_INVENTORY_UNAVAILABLE';

/**
 * The store cannot take orders for now (503, nothing written): inventory
 * unavailable, the link switching source (draining), its warehouse not set,
 * or the store quantities awaiting an approved opening.
 */
const PAUSED_CODES = new Set([
  STORE_INVENTORY_UNAVAILABLE_ERROR,
  'STORE_STOCK_SYNC_DRAINING',
  'STORE_INVENTORY_NOT_CONFIGURED',
  'STORE_LOCAL_STOCK_NOT_OPENED',
]);

export function isStoreInventoryUnavailable(payload: unknown): boolean {
  const body = payload as { error?: { code?: unknown }; code?: unknown } | null | undefined;
  const code = body?.error?.code ?? body?.code;
  return typeof code === 'string' && PAUSED_CODES.has(code);
}
