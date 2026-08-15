'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import type { InventoryStockListQuery } from '@/features/inventory/domain/types/product-stock';

export const posStockQueryKeys = {
  all: (companyId: string) => [companyId, 'inventory', 'pos-stock'] as const,
  list: (query: InventoryStockListQuery) =>
    [...posStockQueryKeys.all(query.companyId), 'list', query] as const,
  product: (companyId: string, productId: string) =>
    [...posStockQueryKeys.all(companyId), 'product', productId] as const,
};

export function usePosStockList(
  query: InventoryStockListQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: posStockQueryKeys.list(query),
    queryFn: () => inventoryStockService.listStock(query),
    enabled: Boolean(query.companyId) && (options?.enabled ?? true),
  });
}

export function usePosProductStock(
  companyId: string,
  productId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: posStockQueryKeys.product(companyId, productId),
    queryFn: () => inventoryStockService.getProductStock(productId),
    enabled: Boolean(companyId && productId) && (options?.enabled ?? true),
  });
}
