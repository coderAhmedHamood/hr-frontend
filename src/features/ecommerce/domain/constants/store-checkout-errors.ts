export const STORE_COUNTRY_UNAVAILABLE_ERROR = 'COUNTRY_UNAVAILABLE';

/** Backend: `Selected country is not available for this store` */
export function isStoreCountryUnavailable(message: string | null | undefined): boolean {
  return /country is not available for this store/i.test(message ?? '');
}

/** Backend 409 `STORE_STOCK_SHORT`: the store's own quantity is short (phase 3). */
export const STORE_STOCK_SHORT_ERROR = 'STORE_STOCK_SHORT';

export function isStoreStockShort(payload: unknown, message: string | null | undefined): boolean {
  const body = payload as { error?: { code?: unknown }; code?: unknown } | null | undefined;
  return (
    body?.error?.code === STORE_STOCK_SHORT_ERROR ||
    body?.code === STORE_STOCK_SHORT_ERROR ||
    /not enough stock/i.test(message ?? '')
  );
}
