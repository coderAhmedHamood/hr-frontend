'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
import type {
  LocationStock,
  LocationStockListQuery,
} from '@/features/inventory/domain/types/location-stock';
import type { ProductStockSnapshot } from '@/features/inventory/domain/types/product-stock';

export const locationStockQueryKeys = {
  root: (companyId: string) => [companyId, 'inventory', 'location-stock'] as const,
  onHand: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'on-hand', productId] as const,
  summary: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'summary', productId] as const,
  raw: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'raw', productId] as const,
  snapshot: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'snapshot', productId] as const,
  list: (query: LocationStockListQuery) =>
    [...locationStockQueryKeys.root(query.companyId), 'list', query] as const,
};

type ProductLocationStockRaw = {
  snapshot: ProductStockSnapshot | null;
  stocks: LocationStock[];
  internalLocationIds: Set<string>;
};

/**
 * Prefer GET /inventory/products/:id/stock (locations[] + live on-hand).
 * Fall back to ledger aggregation when the snapshot is unavailable.
 */
async function fetchProductLocationStockRaw(
  companyId: string,
  productId: string,
): Promise<ProductLocationStockRaw> {
  const [snapshot, stocks, locations] = await Promise.all([
    inventoryStockService.getProductStock(productId),
    inventoryStockService.listLocationStock({ companyId, productId }),
    warehouseLocationsApi.getAll({ companyId, page: 1, limit: 500 }),
  ]);
  const internalLocationIds = new Set(
    locations.items.filter((location) => location.locationType === 'internal').map((l) => l.id),
  );
  return { snapshot, stocks, internalLocationIds };
}

function totalsFromLedger(
  stocks: LocationStock[],
  internalLocationIds: Set<string>,
): { total: number; byVariant: Record<string, number>; onHand: number; reserved: number; available: number } {
  const byVariant: Record<string, number> = {};
  let onHand = 0;
  let reserved = 0;
  for (const row of stocks) {
    if (!internalLocationIds.has(row.locationId)) continue;
    const key = row.variantId ?? '';
    byVariant[key] = (byVariant[key] ?? 0) + row.quantity;
    onHand += row.quantity;
    reserved += row.reservedQuantity ?? 0;
  }
  return { total: onHand, byVariant, onHand, reserved, available: Math.max(0, onHand - reserved) };
}

export function useProductOnHand(companyId: string | undefined, productId: string | undefined) {
  return useQuery({
    ...toRawQueryOptions(companyId, productId),
    select: ({ snapshot, stocks, internalLocationIds }) => {
      if (snapshot) {
        const byVariant: Record<string, number> = {};
        if (snapshot.displayLevel === 'variant') {
          for (const variant of snapshot.variants) {
            byVariant[variant.variantId] = variant.available;
          }
        } else {
          byVariant[''] = snapshot.available;
        }
        return { total: snapshot.available, byVariant, snapshot };
      }
      const ledger = totalsFromLedger(stocks, internalLocationIds);
      return { total: ledger.total, byVariant: ledger.byVariant, snapshot: null };
    },
  });
}

/** On Hand / Reserved / Available for a product (internal locations). */
export function useProductStockSummary(companyId: string | undefined, productId: string | undefined) {
  return useQuery({
    ...toRawQueryOptions(companyId, productId),
    select: ({ snapshot, stocks, internalLocationIds }) => {
      if (snapshot) {
        return {
          onHand: snapshot.onHand,
          reserved: snapshot.reserved,
          available: snapshot.available,
          locations: snapshot.locations,
          snapshot,
        };
      }
      const ledger = totalsFromLedger(stocks, internalLocationIds);
      return {
        onHand: ledger.onHand,
        reserved: ledger.reserved,
        available: ledger.available,
        locations: [] as ProductStockSnapshot['locations'],
        snapshot: null,
      };
    },
  });
}

function toRawQueryOptions(companyId: string | undefined, productId: string | undefined) {
  return {
    queryKey: locationStockQueryKeys.raw(companyId ?? '', productId ?? ''),
    queryFn: () => fetchProductLocationStockRaw(companyId!, productId!),
    enabled: Boolean(companyId && productId),
  };
}

export function useLocationStockList(query: LocationStockListQuery) {
  return useQuery({
    queryKey: locationStockQueryKeys.list(query),
    queryFn: () => inventoryStockService.listLocationStock(query),
    enabled: Boolean(query.companyId),
  });
}
