/**
 * One-shot purge of store dual-path localStorage keys.
 * Kept: storefront-cart, storefront-wishlist (guest favorites), storefront-customer (partner JWT).
 * Removed: remembered orders + admin live commerce mirrors.
 */
const PURGE_KEYS = [
  'storefront-order-history',
  'storefront-order-numbers',
  'ecommerce-admin-live-orders',
  'ecommerce-admin-live-customers',
] as const;

const PURGE_FLAG = 'store-binding-ls-purged-v1';

/** Remove legacy store localStorage mirrors. Safe to call repeatedly. */
export function purgeStoreBindingLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of PURGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    window.localStorage.setItem(PURGE_FLAG, '1');
  } catch {
    // ignore quota / private mode
  }
}
