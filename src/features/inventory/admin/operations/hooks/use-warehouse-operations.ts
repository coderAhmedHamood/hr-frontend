import { useQuery } from '@tanstack/react-query';
import { warehouseOperationsApi } from '@/features/inventory/admin/operations/lib/api/warehouse-operations';
import { warehouseOperationsQueryKeys } from '@/features/inventory/admin/hooks/query-keys';
import type { WarehouseOperationListQuery } from '@/features/inventory/domain/types/warehouse';

export function useWarehouseOperations(query: WarehouseOperationListQuery) {
  return useQuery({
    queryKey: warehouseOperationsQueryKeys.list(query),
    queryFn: () => warehouseOperationsApi.getAll(query),
    enabled: Boolean(
      query.companyId && (query.warehouseId || query.productId || query.kind || query.all),
    ),
  });
}
