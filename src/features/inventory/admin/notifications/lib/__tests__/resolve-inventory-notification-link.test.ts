import { resolveInventoryNotificationLink } from '@/features/inventory/admin/notifications/lib/resolve-inventory-notification-link';

describe('resolveInventoryNotificationLink — product notifications (phase 2.6)', () => {
  it('links catalog_products and the pre-2.6 value to the product', () => {
    for (const sourceTable of ['catalog_products', 'inventory_products']) {
      expect(
        resolveInventoryNotificationLink({ sourceTable, sourceId: 'p-1' } as Parameters<
          typeof resolveInventoryNotificationLink
        >[0]),
      ).toBe('/inventory/products?highlight=p-1');
    }
  });
});
