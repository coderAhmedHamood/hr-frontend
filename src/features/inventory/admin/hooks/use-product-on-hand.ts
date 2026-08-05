'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
import type {
  LocationStock,
  LocationStockListQuery,
} from '@/features/inventory/domain/types/location-stock';

export const locationStockQueryKeys = {
  root: (companyId: string) => [companyId, 'inventory', 'location-stock'] as const,
  onHand: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'on-hand', productId] as const,
  summary: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'summary', productId] as const,
  raw: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'raw', productId] as const,
  list: (query: LocationStockListQuery) =>
    [...locationStockQueryKeys.root(query.companyId), 'list', query] as const,
};

type ProductLocationStockRaw = {
  stocks: LocationStock[];
  internalLocationIds: Set<string>;
};

/**
 * Shared underlying fetch for on-hand + summary — both need the same
 * ledger-derived stock rows and internal-location set. Using one query key
 * with different `select` transforms lets React Query dedupe the network
 * call instead of each hook re-fetching independently.
 */
async function fetchProductLocationStockRaw(
  companyId: string,
  productId: string,
): Promise<ProductLocationStockRaw> {
  const [stocks, locations] = await Promise.all([
    inventoryStockService.listLocationStock({ companyId, productId }),
    warehouseLocationsApi.getAll({ companyId, page: 1, limit: 500 }),
  ]);
  const internalLocationIds = new Set(
    locations.items.filter((location) => location.locationType === 'internal').map((l) => l.id),
  );
  return { stocks, internalLocationIds };
}

export function useProductOnHand(companyId: string | undefined, productId: string | undefined) {
  return useQuery({
    ...toRawQueryOptions(companyId, productId),
    select: ({ stocks, internalLocationIds }) => {
      const byVariant: Record<string, number> = {};
      let total = 0;
      for (const row of stocks) {
        if (!internalLocationIds.has(row.locationId)) continue;
        const key = row.variantId ?? '';
        byVariant[key] = (byVariant[key] ?? 0) + row.quantity;
        total += row.quantity;
      }
      return { total, byVariant };
    },
  });
}

/** On Hand / Reserved / Available for a product (internal locations). */
export function useProductStockSummary(companyId: string | undefined, productId: string | undefined) {
  return useQuery({
    ...toRawQueryOptions(companyId, productId),
    select: ({ stocks, internalLocationIds }) => {
      let onHand = 0;
      let reserved = 0;
      for (const row of stocks) {
        if (!internalLocationIds.has(row.locationId)) continue;
        onHand += row.quantity;
        reserved += row.reservedQuantity ?? 0;
      }
      return { onHand, reserved, available: Math.max(0, onHand - reserved) };
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
