import { inventoryLedgerApi } from '@/features/inventory/admin/operations/lib/api/inventory-ledger';
import { warehousesApi } from '@/features/inventory/admin/warehouses/lib/api/warehouses';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
import {
  getMockStockAvailability,
  listMockLocationStock,
} from '@/features/inventory/shared/lib/mock/mock-location-stock-store';
import type {
  LocationStock,
  LocationStockListQuery,
  StockAvailabilityRow,
} from '@/features/inventory/domain/types/location-stock';

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

type StockKey = string;

function stockKey(parts: {
  companyId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  locationId: string;
}): StockKey {
  return [
    parts.companyId,
    parts.productId,
    parts.variantId ?? '',
    parts.warehouseId,
    parts.locationId,
  ].join('|');
}

/** Session-only reservations — backend has no location-stock / reserve API yet. */
const reservedByKey = new Map<StockKey, number>();

function availableOf(row: LocationStock): number {
  return Math.max(0, row.quantity - (row.reservedQuantity ?? 0));
}

/**
 * Live balances derived from `/inventory/ledger-entries`.
 * There is no location-stock API; ledger is the source of truth.
 */
export const locationStockApi = {
  async list(query: LocationStockListQuery): Promise<LocationStock[]> {
    let ledgerItems: Awaited<ReturnType<typeof inventoryLedgerApi.list>>['items'] = [];
    try {
      const ledger = await inventoryLedgerApi.list({
        companyId: query.companyId,
        productId: query.productId,
        warehouseId: query.warehouseId,
        locationId: query.locationId,
        page: 1,
        limit: 500,
      });
      ledgerItems = ledger.items;
    } catch {
      ledgerItems = [];
    }

    const aggregated = new Map<StockKey, LocationStock>();
    for (const entry of ledgerItems) {
      if (query.variantId !== undefined) {
        if (query.variantId === '') {
          if (entry.variantId) continue;
        } else if (entry.variantId !== query.variantId) {
          continue;
        }
      }

      const key = stockKey({
        companyId: entry.companyId,
        productId: entry.productId,
        variantId: entry.variantId,
        warehouseId: entry.warehouseId,
        locationId: entry.locationId,
      });
      const existing = aggregated.get(key);
      if (existing) {
        existing.quantity += entry.quantityDelta;
        existing.updatedAt =
          entry.createdAt > existing.updatedAt ? entry.createdAt : existing.updatedAt;
      } else {
        aggregated.set(key, {
          id: key,
          companyId: entry.companyId,
          productId: entry.productId,
          variantId: entry.variantId,
          warehouseId: entry.warehouseId,
          locationId: entry.locationId,
          quantity: entry.quantityDelta,
          reservedQuantity: reservedByKey.get(key) ?? 0,
          updatedAt: entry.createdAt,
        });
      }
    }

    let rows = [...aggregated.values()]
      .map((row) => ({
        ...row,
        reservedQuantity: reservedByKey.get(
          stockKey({
            companyId: row.companyId,
            productId: row.productId,
            variantId: row.variantId,
            warehouseId: row.warehouseId,
            locationId: row.locationId,
          }),
        ) ?? row.reservedQuantity ?? 0,
      }))
      .filter((row) => row.quantity !== 0 || (row.reservedQuantity ?? 0) !== 0);

    // Ecommerce demo catalog uses seeded JSON when the live ledger has no balances yet.
    if (rows.length === 0) {
      rows = listMockLocationStock(query.companyId, query.productId).filter((row) => {
        if (query.warehouseId && row.warehouseId !== query.warehouseId) return false;
        if (query.locationId && row.locationId !== query.locationId) return false;
        return true;
      });
    }

    return rows;
  },

  async getOnHandTotal(
    companyId: string,
    productId: string,
    options?: { variantId?: string },
  ): Promise<number> {
    const summary = await this.getStockSummary(companyId, productId, options);
    return summary.onHand;
  },

  async getOnHandByVariant(
    companyId: string,
    productId: string,
  ): Promise<{ total: number; byVariant: Record<string, number> }> {
    const [stocks, locations] = await Promise.all([
      this.list({ companyId, productId }),
      warehouseLocationsApi.getAll({ companyId, page: 1, limit: 500 }),
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
      warehouseLocationsApi.getAll({ companyId, page: 1, limit: 500 }),
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
    const mockRows = getMockStockAvailability(companyId, productId);

    let stocks: LocationStock[] = [];
    try {
      stocks = await this.list({ companyId, productId });
    } catch {
      return mockRows;
    }

    if (stocks.length === 0) {
      return mockRows;
    }

    let warehouseMap = new Map<string, { nameAr: string }>();
    let locationMap = new Map<string, { nameAr: string }>();
    try {
      const [warehouses, locations] = await Promise.all([
        warehousesApi.getAll({ companyId, page: 1, limit: 200 }),
        warehouseLocationsApi.getAll({ companyId, page: 1, limit: 500 }),
      ]);
      warehouseMap = new Map(warehouses.items.map((w) => [w.id, w]));
      locationMap = new Map(locations.items.map((l) => [l.id, l]));
    } catch {
      // Fall through — names filled from mock seed below.
    }

    const mockByLocation = new Map(mockRows.map((row) => [row.locationId, row]));

    const liveRows = stocks
      .filter((row) => row.quantity > 0 || (row.reservedQuantity ?? 0) > 0)
      .map((row) => {
        const warehouse = warehouseMap.get(row.warehouseId);
        const location = locationMap.get(row.locationId);
        const mock = mockByLocation.get(row.locationId);
        const reservedQuantity = row.reservedQuantity ?? 0;
        return {
          warehouseId: row.warehouseId,
          warehouseNameAr: warehouse?.nameAr ?? mock?.warehouseNameAr ?? row.warehouseId,
          locationId: row.locationId,
          locationNameAr: location?.nameAr ?? mock?.locationNameAr ?? row.locationId,
          quantity: row.quantity,
          reservedQuantity,
          availableQuantity: availableOf(row),
        };
      })
      .sort((a, b) => b.availableQuantity - a.availableQuantity);

    return liveRows.length > 0 ? liveRows : mockRows;
  },

  /**
   * No-op for live balances — ledger append already recorded the movement.
   * Kept so applyDoneOperation can still call adjust without double-writing.
   */
  async adjust(input: LocationStockAdjustInput): Promise<LocationStock> {
    const key = stockKey(input);
    const stocks = await this.list({
      companyId: input.companyId,
      productId: input.productId,
      locationId: input.locationId,
      variantId: input.variantId ?? '',
    });
    const existing = stocks.find((row) =>
      input.variantId ? row.variantId === input.variantId : !row.variantId,
    );
    return {
      id: existing?.id ?? key,
      companyId: input.companyId,
      productId: input.productId,
      variantId: input.variantId,
      warehouseId: input.warehouseId,
      locationId: input.locationId,
      quantity: (existing?.quantity ?? 0),
      reservedQuantity: reservedByKey.get(key) ?? 0,
      updatedAt: new Date().toISOString(),
    };
  },

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
    const key = stockKey(input);
    const nextReserved = (reservedByKey.get(key) ?? existing.reservedQuantity ?? 0) + input.delta;
    if (nextReserved < 0) {
      throw new Error('لا يمكن تحرير كمية محجوزة أكبر من المحجوز.');
    }
    if (nextReserved > existing.quantity) {
      throw new Error('الكمية المتاحة غير كافية للحجز.');
    }
    reservedByKey.set(key, nextReserved);
    return { ...existing, reservedQuantity: nextReserved, updatedAt: new Date().toISOString() };
  },

  async deduct(): Promise<void> {
    throw new Error(
      'locationStockApi.deduct محظور — استخدم inventoryStockService.issueForShipment.',
    );
  },

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
