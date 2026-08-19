import type { Money } from '@/features/ecommerce/domain/types/common';

/**
 * Always two fraction digits + Latin numerals.
 * Node ICU treats YER as 0 decimals; Chromium uses 2 — that mismatch
 * hydrates product cards as "55 ر.ي." vs "55.20 ر.ي.".
 */
const FRACTION_DIGITS = 2;

export function formatPrice({ amount, currency }: Money): string {
  return new Intl.NumberFormat('ar-YE', {
    style: 'currency',
    currency,
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
    numberingSystem: 'latn',
  }).format(amount);
}
