import type {
  WarehouseListQuery,
  WarehouseLocationListQuery,
  WarehouseOperationKind,
  WarehouseOperationListQuery,
} from '@/features/inventory/domain/types/warehouse';

export const warehousesQueryKeys = {
  all: (companyId: string) => [companyId, 'ecommerce', 'warehouses'] as const,
  list: (query: WarehouseListQuery) => [...warehousesQueryKeys.all(query.companyId), 'list', query] as const,
  detail: (companyId: string, id: string) => [...warehousesQueryKeys.all(companyId), 'detail', id] as const,
};

export const warehouseLocationsQueryKeys = {
  all: (companyId: string) => [companyId, 'ecommerce', 'warehouse-locations'] as const,
  list: (query: WarehouseLocationListQuery) =>
    [...warehouseLocationsQueryKeys.all(query.companyId), 'list', query] as const,
};

export const warehouseOperationsQueryKeys = {
  root: (companyId: string) => [companyId, 'ecommerce', 'warehouse-operations'] as const,
  all: (companyId: string, warehouseId: string, kind: WarehouseOperationKind) =>
    [...warehouseOperationsQueryKeys.root(companyId), warehouseId, kind] as const,
  list: (query: WarehouseOperationListQuery) =>
    [...warehouseOperationsQueryKeys.root(query.companyId), 'list', query] as const,
  byProduct: (companyId: string, productId: string, kind?: WarehouseOperationKind) =>
    [...warehouseOperationsQueryKeys.root(companyId), 'by-product', productId, kind ?? 'all'] as const,
};
