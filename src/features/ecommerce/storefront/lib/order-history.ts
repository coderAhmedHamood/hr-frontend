/**
 * Order history localStorage removed (store-frontend-binding.md).
 * Guest tracking is orderNumber + phone via public API only.
 */

export type RememberedStorefrontOrder = {
  orderNumber: string;
  phone: string;
};

export function rememberStorefrontOrderNumber(_orderNumber: string, _phone?: string | null) {
  // no-op — do not persist orders in localStorage
}

export function listRememberedStorefrontOrders(): RememberedStorefrontOrder[] {
  return [];
}

export function listRememberedStorefrontOrderNumbers(): string[] {
  return [];
}

export function findRememberedOrderPhone(_orderNumber: string): string | null {
  return null;
}
