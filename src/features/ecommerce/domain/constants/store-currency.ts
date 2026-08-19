/** Store catalog is single-currency. Checkout rejects products priced in anything else. */
export const STORE_CURRENCY_CODE = 'YER' as const;

/** Checkout / place-order error code when a product priceCurrency ≠ store currency. */
export const STORE_CURRENCY_MISMATCH_ERROR = 'CURRENCY_MISMATCH';

export function isStoreCurrency(code: string | null | undefined): boolean {
  return (code ?? '').trim().toUpperCase() === STORE_CURRENCY_CODE;
}

/** Backend: `Product #<uuid> is priced in SAR but the store currency is YER` */
export function isProductStoreCurrencyMismatch(message: string | null | undefined): boolean {
  return /priced in \w+ but the store currency/i.test(message ?? '');
}
