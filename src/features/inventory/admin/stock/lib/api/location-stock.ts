import { inventoryStockBalancesApi } from '@/features/inventory/admin/stock/lib/api/inventory-stock-balances-api';
import type {
  LocationStock,
  LocationStockListQuery,
  StockAvailabilityRow,
} from '@/features/inventory/domain/types/location-stock';

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

function availableOf(row: LocationStock): number {
  return Math.max(0, row.quantity - (row.reservedQuantity ?? 0));
}

/**
 * Live balances from `GET /inventory/stock/balances` (Σ ledger on the server).
 */
export const locationStockApi = {
  async list(query: LocationStockListQuery): Promise<LocationStock[]> {
    if (!query.companyId?.trim()) return [];

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
          return {
            id: key,
            companyId: query.companyId,
            productId: row.productId!,
            variantId: row.variantId ?? undefined,
            warehouseId: row.warehouseId!,
            locationId: row.locationId!,
            productNameAr: row.productNameAr ?? undefined,
            productSku: row.productSku ?? undefined,
            variantNameAr: row.variantNameAr ?? undefined,
            variantSku: row.variantSku ?? undefined,
            warehouseNameAr: row.warehouseNameAr ?? undefined,
            warehouseCode: row.warehouseCode ?? undefined,
            locationNameAr: row.locationNameAr ?? undefined,
            locationCode: row.locationCode ?? undefined,
            locationType: row.locationType ?? undefined,
            trackInventory: row.trackInventory ?? undefined,
            lowStockThreshold: row.lowStockThreshold,
            unitCost: row.unitCost,
            costCurrency: row.costCurrency ?? undefined,
            historicalUnitCost: row.historicalUnitCost,
            historicalValue: row.historicalValue,
            costingStatus: row.costingStatus,
            quantity: row.onHand,
            reservedQuantity: row.reserved,
            updatedAt: row.lastMovementAt ?? new Date(0).toISOString(),
          };
      })
      .filter((row) => row.quantity !== 0 || (row.reservedQuantity ?? 0) !== 0);
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
    const stocks = await this.list({ companyId, productId });
    const byVariant: Record<string, number> = {};
    let total = 0;
    for (const row of stocks) {
      if (row.locationType !== 'internal') continue;
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
    const stocks = await this.list({
      companyId,
      productId,
      ...(options?.variantId !== undefined ? { variantId: options.variantId } : {}),
    });
    let onHand = 0;
    let reserved = 0;
    for (const row of stocks) {
      if (row.locationType !== 'internal') continue;
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

    const liveRows = stocks
      .filter((row) => row.quantity > 0 || (row.reservedQuantity ?? 0) > 0)
      .map((row) => {
        const reservedQuantity = row.reservedQuantity ?? 0;
        return {
          warehouseId: row.warehouseId,
          warehouseNameAr: row.warehouseNameAr ?? row.warehouseId,
          locationId: row.locationId,
          locationNameAr: row.locationNameAr || row.locationCode || row.locationId,
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
