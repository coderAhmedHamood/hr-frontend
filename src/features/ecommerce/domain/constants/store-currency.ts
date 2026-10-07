import { companyCurrencyCode } from '@/features/auth/lib/company-currency';

/**
 * The store sells in the company's base currency (company settings); checkout
 * rejects products priced in anything else.
 */
export function storeCurrencyCode(): string {
  return companyCurrencyCode();
}

/** Checkout / place-order error code when a product priceCurrency ≠ store currency. */
export const STORE_CURRENCY_MISMATCH_ERROR = 'CURRENCY_MISMATCH';

export function isStoreCurrency(code: string | null | undefined): boolean {
  return (code ?? '').trim().toUpperCase() === storeCurrencyCode();
}

/** Backend: `Product #<uuid> is priced in SAR but the store currency is YER` (any two codes). */
export function isProductStoreCurrencyMismatch(message: string | null | undefined): boolean {
  return /priced in \w+ but the store currency/i.test(message ?? '');
}
