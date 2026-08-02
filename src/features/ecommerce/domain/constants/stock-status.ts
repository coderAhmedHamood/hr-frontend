/**
 * Renamed/clarified from the earlier `ProductAvailability` — the customer-facing purchasability
 * signal, explicitly admin-set, never auto-derived from `Inventory.quantity`. "Low stock" is a
 * computed UI badge (`quantity <= lowStockThreshold`), not a status value.
 */
export type StockStatus = 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued';

export const STOCK_STATUS_LABELS_AR: Record<StockStatus, string> = {
  in_stock: 'متوفر',
  out_of_stock: 'غير متوفر',
  preorder: 'طلب مسبق',
  discontinued: 'موقوف',
};

export const STOCK_STATUS_OPTIONS: { value: StockStatus; labelAr: string }[] = (
  Object.entries(STOCK_STATUS_LABELS_AR) as [StockStatus, string][]
).map(([value, labelAr]) => ({ value, labelAr }));
