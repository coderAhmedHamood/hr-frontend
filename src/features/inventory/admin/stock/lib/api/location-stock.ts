import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import {
  mockWarehouseLocationsStore,
  mockWarehousesStore,
} from '@/features/inventory/shared/lib/adapters/mock-inventory-store';
import type {
  LocationStock,
  LocationStockListQuery,
  StockAvailabilityRow,
} from '@/features/inventory/domain/types/location-stock';
import locationStockSeed from '@/features/inventory/shared/lib/mock/location-stock.json';

const repository = createMockRepository<LocationStock>(
  (locationStockSeed as LocationStock[]).map((row) => ({
    ...row,
    reservedQuantity: row.reservedQuantity ?? 0,
  })),
);

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120));
}

function newId() {
  return `ls-${Math.random().toString(36).slice(2, 10)}`;
}

function availableOf(row: LocationStock): number {
  return Math.max(0, row.quantity - (row.reservedQuantity ?? 0));
}

export type LocationStockAdjustInput = {
  companyId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  locationId: string;
  /** Positive = increase, negative = decrease */
  delta: number;
};

export type LocationStockReserveInput = {
  companyId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  locationId: string;
  /** Positive = reserve more, negative = release */
  delta: number;
};

/**
 * Low-level LocationStock store.
 * Mutations (adjust / reserve / deduct) are for inventoryStockService only.
 * External modules (Sales, UI) must use inventoryStockService.
 */
export const locationStockApi = {
  async list(query: LocationStockListQuery): Promise<LocationStock[]> {
    const result = await repository.list(
      { companyId: query.companyId, page: 1, limit: 500 },
      (item, q) => {
        if (query.productId && item.productId !== query.productId) return false;
        if (query.variantId !== undefined) {
          if (query.variantId === '') {
            if (item.variantId) return false;
          } else if (item.variantId !== query.variantId) {
            return false;
          }
        }
        if (query.warehouseId && item.warehouseId !== query.warehouseId) return false;
        if (query.locationId && item.locationId !== query.locationId) return false;
        return item.companyId === q.companyId;
      },
    );
    return result.items.map((row) => ({
      ...row,
      reservedQuantity: row.reservedQuantity ?? 0,
    }));
  },

  /** On-hand qty at internal warehouse locations only. */
  async getOnHandTotal(
    companyId: string,
    productId: string,
    options?: { variantId?: string },
  ): Promise<number> {
    const summary = await this.getStockSummary(companyId, productId, options);
    return summary.onHand;
  },

  /** Totals keyed by variantId (empty string = product-level / no variant). */
  async getOnHandByVariant(
    companyId: string,
    productId: string,
  ): Promise<{ total: number; byVariant: Record<string, number> }> {
    const [stocks, locations] = await Promise.all([
      this.list({ companyId, productId }),
      mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 }),
    ]);
    const internalIds = new Set(
      locations.items.filter((location) => location.locationType === 'internal').map((l) => l.id),
    );
    const byVariant: Record<string, number> = {};
    let total = 0;
    for (const row of stocks) {
      if (!internalIds.has(row.locationId)) continue;
      const key = row.variantId ?? '';
      byVariant[key] = (byVariant[key] ?? 0) + row.quantity;
      total += row.quantity;
    }
    return { total, byVariant };
  },

  /** On Hand / Reserved / Available at internal locations. */
  async getStockSummary(
    companyId: string,
    productId: string,
    options?: { variantId?: string },
  ): Promise<{ onHand: number; reserved: number; available: number }> {
    const [stocks, locations] = await Promise.all([
      this.list({
        companyId,
        productId,
        ...(options?.variantId !== undefined ? { variantId: options.variantId } : {}),
      }),
      mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 }),
    ]);
    const internalIds = new Set(
      locations.items.filter((location) => location.locationType === 'internal').map((l) => l.id),
    );
    let onHand = 0;
    let reserved = 0;
    for (const row of stocks) {
      if (!internalIds.has(row.locationId)) continue;
      onHand += row.quantity;
      reserved += row.reservedQuantity ?? 0;
    }
    return { onHand, reserved, available: Math.max(0, onHand - reserved) };
  },

  async getAvailability(companyId: string, productId: string): Promise<StockAvailabilityRow[]> {
    const [stocks, warehouses, locations] = await Promise.all([
      this.list({ companyId, productId }),
      mockWarehousesStore.list({ companyId, page: 1, limit: 200 }),
      mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 }),
    ]);

    const warehouseMap = new Map(warehouses.items.map((w) => [w.id, w]));
    const locationMap = new Map(locations.items.map((l) => [l.id, l]));

    return stocks
      .filter((row) => row.quantity > 0 || (row.reservedQuantity ?? 0) > 0)
      .map((row) => {
        const warehouse = warehouseMap.get(row.warehouseId);
        const location = locationMap.get(row.locationId);
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
  },

  async adjust(input: LocationStockAdjustInput): Promise<LocationStock> {
    const stocks = await this.list({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      variantId: input.variantId ?? '',
    });
    const existing = stocks.find((row) =>
      input.variantId ? row.variantId === input.variantId : !row.variantId,
    );
    const nextQty = (existing?.quantity ?? 0) + input.delta;
    if (nextQty < 0) {
      throw new Error('الكمية في الموقع غير كافية لإتمام الحركة.');
    }
    const now = new Date().toISOString();
    if (existing) {
      const updated = await repository.update(input.companyId, existing.id, {
        quantity: nextQty,
        updatedAt: now,
      });
      if (!updated) throw new Error('تعذر تحديث مخزون الموقع.');
      return { ...updated, reservedQuantity: updated.reservedQuantity ?? 0 };
    }
    return repository.create({
      id: newId(),
      companyId: input.companyId,
      productId: input.productId,
      variantId: input.variantId,
      warehouseId: input.warehouseId,
      locationId: input.locationId,
      quantity: nextQty,
      reservedQuantity: 0,
      updatedAt: now,
    });
  },

  /** Reserve (+) or release (−) quantity without changing on-hand. */
  async reserve(input: LocationStockReserveInput): Promise<LocationStock> {
    const stocks = await this.list({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      variantId: input.variantId ?? '',
    });
    const existing = stocks.find((row) =>
      input.variantId ? row.variantId === input.variantId : !row.variantId,
    );
    if (!existing) {
      throw new Error('لا يوجد رصيد في الموقع للحجز.');
    }
    const nextReserved = (existing.reservedQuantity ?? 0) + input.delta;
    if (nextReserved < 0) {
      throw new Error('لا يمكن تحرير كمية محجوزة أكبر من المحجوز.');
    }
    if (nextReserved > existing.quantity) {
      throw new Error('الكمية المتاحة غير كافية للحجز.');
    }
    const updated = await repository.update(input.companyId, existing.id, {
      reservedQuantity: nextReserved,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new Error('تعذر تحديث الحجز.');
    return { ...updated, reservedQuantity: updated.reservedQuantity ?? 0 };
  },

  /**
   * @deprecated Do not call from Sales/UI. Use inventoryStockService.issueForShipment.
   * Kept only so accidental callers fail loudly.
   */
  async deduct(): Promise<void> {
    throw new Error(
      'locationStockApi.deduct محظور — استخدم inventoryStockService.issueForShipment.',
    );
  },

  /** Quantity currently on hand at a location (for stock count theoretical). */
  async getQuantityAtLocation(
    companyId: string,
    productId: string,
    locationId: string,
    variantId?: string,
  ): Promise<number> {
    const stocks = await this.list({
      companyId,
      productId,
      locationId,
      variantId: variantId ?? '',
    });
    const row = stocks.find((item) =>
      variantId ? item.variantId === variantId : !item.variantId,
    );
    return row?.quantity ?? 0;
  },
};
