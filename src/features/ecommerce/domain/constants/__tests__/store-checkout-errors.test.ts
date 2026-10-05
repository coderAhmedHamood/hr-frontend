import {
  isStoreInventoryUnavailable,
  isStoreStockShort,
} from '@/features/ecommerce/domain/constants/store-checkout-errors';

describe('store checkout errors', () => {
  it('reads STORE_STOCK_SHORT from the envelope or the body', () => {
    expect(isStoreStockShort({ error: { code: 'STORE_STOCK_SHORT' } }, null)).toBe(true);
    expect(isStoreStockShort({ code: 'STORE_STOCK_SHORT' }, null)).toBe(true);
    expect(isStoreStockShort(null, 'Not enough stock for this item')).toBe(true);
    expect(isStoreStockShort({ error: { code: 'OTHER' } }, 'x')).toBe(false);
  });

  it('reads STORE_INVENTORY_UNAVAILABLE (phase 4, the order was not placed)', () => {
    expect(isStoreInventoryUnavailable({ error: { code: 'STORE_INVENTORY_UNAVAILABLE' } })).toBe(true);
    expect(isStoreInventoryUnavailable({ code: 'STORE_INVENTORY_UNAVAILABLE' })).toBe(true);
    expect(isStoreInventoryUnavailable({ error: { code: 'STORE_STOCK_SHORT' } })).toBe(false);
    expect(isStoreInventoryUnavailable(undefined)).toBe(false);
  });
});
