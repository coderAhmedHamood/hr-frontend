import type { LocationStock, StockAvailabilityRow } from '@/features/inventory/domain/types/location-stock';
import type { Warehouse, WarehouseLocation } from '@/features/inventory/domain/types/warehouse';
import locationStockSeed from '@/features/inventory/shared/lib/mock/location-stock.json';
import warehousesSeed from '@/features/inventory/shared/lib/mock/warehouses.json';
import warehouseLocationsSeed from '@/features/inventory/shared/lib/mock/warehouse-locations.json';

const globalForMockStock = globalThis as typeof globalThis & {
  __ecommerceMockLocationStock?: LocationStock[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getStockRows(): LocationStock[] {
  if (!globalForMockStock.__ecommerceMockLocationStock) {
    globalForMockStock.__ecommerceMockLocationStock = clone(locationStockSeed as LocationStock[]);
  }
  return globalForMockStock.__ecommerceMockLocationStock;
}

function availableOf(row: LocationStock): number {
  return Math.max(0, row.quantity - (row.reservedQuantity ?? 0));
}

/** Named warehouses for ecommerce mock fulfillment (dashboard inventory JSON). */
export function listMockWarehouses(companyId: string): Warehouse[] {
  return (warehousesSeed as Warehouse[]).filter((row) => row.companyId === companyId);
}

/** Named locations (مخازن / رفوف) for ecommerce mock fulfillment. */
export function listMockWarehouseLocations(companyId: string): WarehouseLocation[] {
  return (warehouseLocationsSeed as WarehouseLocation[]).filter((row) => row.companyId === companyId);
}

export function listMockLocationStock(companyId: string, productId?: string): LocationStock[] {
  return getStockRows().filter(
    (row) => row.companyId === companyId && (!productId || row.productId === productId),
  );
}

export function getMockStockAvailability(
  companyId: string,
  productId: string,
): StockAvailabilityRow[] {
  const warehouses = new Map(listMockWarehouses(companyId).map((w) => [w.id, w]));
  const locations = new Map(listMockWarehouseLocations(companyId).map((l) => [l.id, l]));

  return listMockLocationStock(companyId, productId)
    .filter((row) => row.quantity > 0 || (row.reservedQuantity ?? 0) > 0)
    .map((row) => {
      const warehouse = warehouses.get(row.warehouseId);
      const location = locations.get(row.locationId);
      const reservedQuantity = row.reservedQuantity ?? 0;
      return {
        warehouseId: row.warehouseId,
        warehouseNameAr: warehouse?.nameAr ?? row.warehouseId,
        locationId: row.locationId,
        locationNameAr: location?.nameAr ?? row.locationId,
        quantity: row.quantity,
        reservedQuantity,
        availableQuantity: availableOf(row),
      };
    })
    .sort((a, b) => b.availableQuantity - a.availableQuantity);
}

export function deductMockLocationStock(input: {
  companyId: string;
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
}): void {
  const rows = getStockRows();
  const row = rows.find(
    (item) =>
      item.companyId === input.companyId &&
      item.productId === input.productId &&
      item.warehouseId === input.warehouseId &&
      item.locationId === input.locationId,
  );
  if (!row) {
    throw new Error('لا يوجد رصيد في الموقع المحدد.');
  }
  if (availableOf(row) < input.quantity) {
    throw new Error('الكمية المتاحة غير كافية للصرف.');
  }
  row.quantity -= input.quantity;
  row.updatedAt = new Date().toISOString();
}

export function hasMockStockForProduct(companyId: string, productId: string): boolean {
  return listMockLocationStock(companyId, productId).some((row) => availableOf(row) > 0);
}
