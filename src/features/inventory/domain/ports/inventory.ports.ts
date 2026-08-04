import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  CreateWarehouseInput,
  CreateWarehouseLocationInput,
  CreateWarehouseOperationInput,
  UpdateWarehouseInput,
  UpdateWarehouseLocationInput,
  UpdateWarehouseOperationInput,
  Warehouse,
  WarehouseListQuery,
  WarehouseLocation,
  WarehouseLocationListQuery,
  WarehouseOperation,
  WarehouseOperationListQuery,
} from '@/features/inventory/domain/types/warehouse';

export type AdminWarehousesPort = {
  getAll(query: WarehouseListQuery): Promise<PaginatedResult<Warehouse>>;
  getById(companyId: string, id: string): Promise<Warehouse | null>;
  create(input: CreateWarehouseInput): Promise<Warehouse>;
  update(companyId: string, id: string, patch: UpdateWarehouseInput): Promise<Warehouse | null>;
  remove(companyId: string, id: string): Promise<boolean>;
};

export type AdminWarehouseLocationsPort = {
  getAll(query: WarehouseLocationListQuery): Promise<PaginatedResult<WarehouseLocation>>;
  getById(companyId: string, id: string): Promise<WarehouseLocation | null>;
  create(input: CreateWarehouseLocationInput): Promise<WarehouseLocation>;
  update(companyId: string, id: string, patch: UpdateWarehouseLocationInput): Promise<WarehouseLocation | null>;
  remove(companyId: string, id: string): Promise<boolean>;
};

export type AdminWarehouseOperationsPort = {
  getAll(query: WarehouseOperationListQuery): Promise<PaginatedResult<WarehouseOperation>>;
  getById(companyId: string, id: string): Promise<WarehouseOperation | null>;
  create(input: CreateWarehouseOperationInput): Promise<WarehouseOperation>;
  update(companyId: string, id: string, patch: UpdateWarehouseOperationInput): Promise<WarehouseOperation | null>;
  remove(companyId: string, id: string): Promise<boolean>;
};
