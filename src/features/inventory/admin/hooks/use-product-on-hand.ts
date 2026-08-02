'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import type { LocationStockListQuery } from '@/features/inventory/domain/types/location-stock';

export const locationStockQueryKeys = {
  root: (companyId: string) => [companyId, 'inventory', 'location-stock'] as const,
  onHand: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'on-hand', productId] as const,
  summary: (companyId: string, productId: string) =>
    [...locationStockQueryKeys.root(companyId), 'summary', productId] as const,
  list: (query: LocationStockListQuery) =>
    [...locationStockQueryKeys.root(query.companyId), 'list', query] as const,
};

export function useProductOnHand(companyId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: locationStockQueryKeys.onHand(companyId ?? '', productId ?? ''),
    queryFn: () => inventoryStockService.getOnHandByVariant(companyId!, productId!),
    enabled: Boolean(companyId && productId),
  });
}

/** On Hand / Reserved / Available for a product (internal locations). */
export function useProductStockSummary(companyId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: locationStockQueryKeys.summary(companyId ?? '', productId ?? ''),
    queryFn: () => inventoryStockService.getStockSummary(companyId!, productId!),
    enabled: Boolean(companyId && productId),
  });
}

export function useLocationStockList(query: LocationStockListQuery) {
  return useQuery({
    queryKey: locationStockQueryKeys.list(query),
    queryFn: () => inventoryStockService.listLocationStock(query),
    enabled: Boolean(query.companyId),
  });
}
