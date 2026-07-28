export const STOREFRONT_ORDER_HISTORY_KEY = 'storefront-order-numbers';

export function rememberStorefrontOrderNumber(orderNumber: string) {
  try {
    const raw = localStorage.getItem(STOREFRONT_ORDER_HISTORY_KEY);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [orderNumber, ...list.filter((item) => item !== orderNumber)].slice(0, 20);
    localStorage.setItem(STOREFRONT_ORDER_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function listRememberedStorefrontOrderNumbers(): string[] {
  try {
    const raw = localStorage.getItem(STOREFRONT_ORDER_HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
