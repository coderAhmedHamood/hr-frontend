import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  Warehouse,
  WarehouseListQuery,
} from '@/features/inventory/domain/types/warehouse';
import type { AdminWarehousesPort } from '@/features/inventory/domain/ports/inventory.ports';

type WarehouseDto = Warehouse & {
  branchId?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

function mapWarehouse(dto: WarehouseDto): Warehouse {
  return {
    id: dto.id,
    companyId: dto.companyId,
    code: dto.code,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? undefined,
    description: dto.description ?? undefined,
    address: dto.address ?? undefined,
    branchId: dto.branchId ?? null,
    status: dto.status,
    incomingSteps: dto.incomingSteps,
    outgoingSteps: dto.outgoingSteps,
    buyToResupply: dto.buyToResupply,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function toCreateBody(input: CreateWarehouseInput) {
  return {
    companyId: input.companyId,
    code: input.code,
    nameAr: input.nameAr,
    nameEn: input.nameEn ?? null,
    description: input.description ?? null,
    address: input.address ?? null,
    branchId: input.branchId === undefined ? undefined : input.branchId,
    status: input.status,
    incomingSteps: input.incomingSteps,
    outgoingSteps: input.outgoingSteps,
    buyToResupply: input.buyToResupply,
  };
}

function toUpdateBody(patch: UpdateWarehouseInput) {
  const body: Record<string, unknown> = {};
  if (patch.code !== undefined) body.code = patch.code;
  if (patch.nameAr !== undefined) body.nameAr = patch.nameAr;
  if (patch.nameEn !== undefined) body.nameEn = patch.nameEn ?? null;
  if (patch.description !== undefined) body.description = patch.description ?? null;
  if (patch.address !== undefined) body.address = patch.address ?? null;
  if (patch.branchId !== undefined) body.branchId = patch.branchId;
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.incomingSteps !== undefined) body.incomingSteps = patch.incomingSteps;
  if (patch.outgoingSteps !== undefined) body.outgoingSteps = patch.outgoingSteps;
  if (patch.buyToResupply !== undefined) body.buyToResupply = patch.buyToResupply;
  return body;
}

export const warehousesApi: AdminWarehousesPort = {
  async getAll(query: WarehouseListQuery) {
    if (!query.companyId?.trim()) {
      throw new Error('companyId مطلوب لقائمة المستودعات.');
    }
    const result = await apiRequest<PaginatedResult<WarehouseDto>>('/inventory/warehouses', {
      query: {
        companyId: query.companyId,
        branchId: query.branchId,
        search: query.search,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        archiveScope: 'active',
      },
    });
    return {
      items: (result.items ?? []).map(mapWarehouse),
      pagination: result.pagination,
    };
  },

  async getById(_companyId, id) {
    try {
      const dto = await apiRequest<WarehouseDto>(`/inventory/warehouses/${id}`);
      return dto?.id ? mapWarehouse(dto) : null;
    } catch {
      return null;
    }
  },

  async create(input: CreateWarehouseInput) {
    // Backend seeds default locations (Customers, Vendors, WH/Stock, …).
    const dto = await apiRequest<WarehouseDto>('/inventory/warehouses', {
      method: 'POST',
      body: toCreateBody(input),
    });
    return mapWarehouse(dto);
  },

  async update(_companyId, id, patch: UpdateWarehouseInput) {
    const dto = await apiRequest<WarehouseDto>(`/inventory/warehouses/${id}`, {
      method: 'PATCH',
      body: toUpdateBody(patch),
    });
    return dto?.id ? mapWarehouse(dto) : null;
  },

  async remove(_companyId, id) {
    await apiRequest<void>(`/inventory/warehouses/${id}`, { method: 'DELETE' });
    return true;
  },
};
