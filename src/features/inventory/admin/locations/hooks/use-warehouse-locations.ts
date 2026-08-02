import { useQuery } from '@tanstack/react-query';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
import { warehouseLocationsQueryKeys } from '@/features/inventory/admin/hooks/query-keys';
import type { WarehouseLocationListQuery } from '@/features/inventory/domain/types/warehouse';

export function useWarehouseLocations(query: WarehouseLocationListQuery) {
  return useQuery({
    queryKey: warehouseLocationsQueryKeys.list(query),
    queryFn: () => warehouseLocationsApi.getAll(query),
    enabled: Boolean(query.companyId),
  });
}
