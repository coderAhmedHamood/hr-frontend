import { inventoryStockBalancesApi } from '@/features/inventory/admin/stock/lib/api/inventory-stock-balances-api';
import { warehousesApi } from '@/features/inventory/admin/warehouses/lib/api/warehouses';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
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
 * Live balances from `GET /inventory/stock/balances` (Σ ledger on the server).
 */
export const locationStockApi = {
  async list(query: LocationStockListQuery): Promise<LocationStock[]> {
    if (!query.companyId?.trim()) return [];

    try {
      const balances = await inventoryStockBalancesApi.query({
        companyId: query.companyId,
        productId: query.productId,
        warehouseId: query.warehouseId,
        locationId: query.locationId,
        ...(query.variantId !== undefined
          ? query.variantId === ''
            ? { productLevelOnly: true }
            : { variantId: query.variantId }
          : {}),
        groupBy: 'location',
        includeZero: true,
      });

      return balances.rows
        .filter((row) => row.locationId && row.warehouseId && row.productId)
        .map((row) => {
          const key = stockKey({
            companyId: query.companyId,
            productId: row.productId!,
            variantId: row.variantId ?? undefined,
            warehouseId: row.warehouseId!,
            locationId: row.locationId!,
          });
          const reserved = reservedByKey.get(key) ?? 0;
          return {
            id: key,
            companyId: query.companyId,
            productId: row.productId!,
            variantId: row.variantId ?? undefined,
            warehouseId: row.warehouseId!,
            locationId: row.locationId!,
            quantity: row.onHand,
            reservedQuantity: reserved,
            updatedAt: new Date().toISOString(),
          };
        })
        .filter((row) => row.quantity !== 0 || (row.reservedQuantity ?? 0) !== 0);
    } catch {
      return [];
    }
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

  async getAvailability(
    companyId: string,
    productId: string,
    options?: { variantId?: string | null },
  ): Promise<StockAvailabilityRow[]> {
    // When variantId is provided (including null → base product), scope stock to that SKU.
    // Omitting options keeps legacy “all variants merged” behavior for callers that need totals.
    const scoped = options !== undefined;
    const variantKey = scoped ? options.variantId?.trim() || '' : undefined;

    const stocks = await this.list({
      companyId,
      productId,
      ...(variantKey !== undefined ? { variantId: variantKey } : {}),
    });
    if (stocks.length === 0) return [];

    const [warehouses, locations] = await Promise.all([
      warehousesApi.getAll({ companyId, page: 1, limit: 200 }),
      warehouseLocationsApi.getAll({ companyId, page: 1, limit: 500 }),
    ]);
    const warehouseMap = new Map(warehouses.items.map((w) => [w.id, w]));
    const locationMap = new Map(locations.items.map((l) => [l.id, l]));

    const liveRows = stocks
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
        } satisfies StockAvailabilityRow;
      });

    // Same location can appear once after filtering; merge only if unscoped (all variants).
    if (!scoped) {
      const mergedByLocation = new Map<string, StockAvailabilityRow>();
      for (const row of liveRows) {
        const key = `${row.warehouseId}|${row.locationId}`;
        const existing = mergedByLocation.get(key);
        if (!existing) {
          mergedByLocation.set(key, { ...row });
          continue;
        }
        existing.quantity += row.quantity;
        existing.reservedQuantity += row.reservedQuantity;
        existing.availableQuantity += row.availableQuantity;
      }
      return [...mergedByLocation.values()].sort(
        (a, b) => b.availableQuantity - a.availableQuantity,
      );
    }

    return liveRows
      .filter((row) => row.availableQuantity > 0)
      .sort((a, b) => b.availableQuantity - a.availableQuantity);
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
      'locationStockApi.deduct محظور — استخدم inventoryStockService.saleDeduct أو issueForShipment.',
    );
  },

  async getQuantityAtLocation(
    companyId: string,
    productId: string,
    locationId: string,
    variantId?: string,
  ): Promise<number> {
    try {
      const balances = await inventoryStockBalancesApi.query({
        companyId,
        productId,
        locationIds: [locationId],
        ...(variantId ? { variantId } : { productLevelOnly: true }),
        groupBy: 'total',
        includeZero: true,
      });
      return Math.max(0, balances.totalOnHand);
    } catch {
      return 0;
    }
  },
};
