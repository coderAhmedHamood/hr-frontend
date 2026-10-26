/**
 * «عابر سبيل» checkout (2026-10-26): one order without an account. Kept for
 * this browser tab only and cleared once the order is placed — it is not an
 * account: the customer follows that order by its number and mobile, and the
 * store reaches them on that number.
 */
const KEY = 'store-checkout-guest';

export function readCheckoutGuest(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function writeCheckoutGuest(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.sessionStorage.setItem(KEY, '1');
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Private mode: the choice lasts until the page is left.
  }
}
