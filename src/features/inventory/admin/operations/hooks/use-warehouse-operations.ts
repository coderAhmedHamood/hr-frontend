import { useQuery } from '@tanstack/react-query';
import { warehouseOperationsApi } from '@/features/inventory/admin/operations/lib/api/warehouse-operations';
import { warehouseOperationsQueryKeys } from '@/features/inventory/admin/hooks/query-keys';
import type { WarehouseOperationListQuery } from '@/features/inventory/domain/types/warehouse';

export function useWarehouseOperations(
  query: WarehouseOperationListQuery,
  options?: {
    enabled?: boolean;
    /** Refetch whenever the query mounts / becomes enabled (e.g. each dialog open). */
    refetchOnOpen?: boolean;
  },
) {
  return useQuery({
    queryKey: warehouseOperationsQueryKeys.list(query),
    queryFn: () => warehouseOperationsApi.getAll(query),
    enabled:
      Boolean(query.companyId && (query.warehouseId || query.productId || query.kind || query.all)) &&
      (options?.enabled ?? true),
    staleTime: options?.refetchOnOpen ? 0 : undefined,
    refetchOnMount: options?.refetchOnOpen ? 'always' : undefined,
  });
}
