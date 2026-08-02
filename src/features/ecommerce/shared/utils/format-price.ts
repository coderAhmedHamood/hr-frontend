import type { Money } from '@/features/ecommerce/domain/types/common';

/** Shared by admin and (later) storefront — never hardcode currency formatting per feature. */
export function formatPrice({ amount, currency }: Money): string {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency }).format(amount);
}
