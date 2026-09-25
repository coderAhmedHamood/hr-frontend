import { useQuery } from '@tanstack/react-query';
import { warehouseOperationsApi } from '@/features/inventory/admin/operations/lib/api/warehouse-operations';
import { warehouseOperationsQueryKeys } from '@/features/inventory/admin/hooks/query-keys';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';

export function useOpenOperationProductReservations(input: {
  companyId: string;
  warehouseId: string;
  kind: WarehouseOperationKind;
  enabled?: boolean;
}) {
  const { companyId, warehouseId, kind, enabled = true } = input;
  return useQuery({
    queryKey: warehouseOperationsQueryKeys.openProductReservations(companyId, warehouseId, kind),
    queryFn: () =>
      warehouseOperationsApi.getOpenProductReservations({ companyId, warehouseId, kind }),
    enabled: Boolean(enabled && companyId && warehouseId && kind),
    staleTime: 30_000,
  });
}
