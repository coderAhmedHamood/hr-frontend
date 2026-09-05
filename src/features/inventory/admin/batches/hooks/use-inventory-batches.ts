'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryBatchesApi } from '@/features/inventory/admin/batches/lib/api/inventory-batches';
import type { InventoryBatchListQuery } from '@/features/inventory/domain/types/inventory-batch';

export const inventoryBatchesQueryKeys = {
  root: (companyId: string) => [companyId, 'ecommerce', 'inventory-batches'] as const,
  list: (query: InventoryBatchListQuery) =>
    [...inventoryBatchesQueryKeys.root(query.companyId), 'list', query] as const,
};

export function useInventoryBatches(
  query: InventoryBatchListQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: inventoryBatchesQueryKeys.list(query),
    queryFn: () => inventoryBatchesApi.list(query),
    enabled: Boolean(query.companyId) && (options?.enabled ?? true),
  });
}
