import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  CreateWarehouseLocationInput,
  UpdateWarehouseLocationInput,
  WarehouseLocation,
  WarehouseLocationListQuery,
} from '@/features/inventory/domain/types/warehouse';
import type { AdminWarehouseLocationsPort } from '@/features/inventory/domain/ports/inventory.ports';

type WarehouseLocationDto = WarehouseLocation & {
  isArchived?: boolean;
  archivedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

function mapLocation(dto: WarehouseLocationDto): WarehouseLocation {
  return {
    id: dto.id,
    companyId: dto.companyId,
    warehouseId: dto.warehouseId,
    code: dto.code,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? undefined,
    parentLocationId: dto.parentLocationId ?? null,
    locationType: dto.locationType,
    storageCategory: dto.storageCategory ?? undefined,
    barcode: dto.barcode ?? undefined,
    replenish: dto.replenish,
    cycleCountFrequencyDays: dto.cycleCountFrequencyDays,
    lastCountAt: dto.lastCountAt ?? undefined,
    nextCountAt: dto.nextCountAt ?? undefined,
    removalStrategy: dto.removalStrategy,
    aisle: dto.aisle ?? undefined,
    rack: dto.rack ?? undefined,
    bin: dto.bin ?? undefined,
    isActive: dto.isActive,
    isSystem: dto.isSystem,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function toCreateBody(input: CreateWarehouseLocationInput) {
  return {
    warehouseId: input.warehouseId,
    parentLocationId: input.parentLocationId ?? null,
    code: input.code,
    nameAr: input.nameAr,
    nameEn: input.nameEn ?? null,
    locationType: input.locationType,
    storageCategory: input.storageCategory ?? null,
    barcode: input.barcode ?? null,
    replenish: input.replenish,
    cycleCountFrequencyDays: input.cycleCountFrequencyDays,
    lastCountAt: input.lastCountAt ?? null,
    nextCountAt: input.nextCountAt ?? null,
    removalStrategy: input.removalStrategy,
    aisle: input.aisle ?? null,
    rack: input.rack ?? null,
    bin: input.bin ?? null,
    isActive: input.isActive,
    isSystem: input.isSystem ?? false,
  };
}

function toUpdateBody(patch: UpdateWarehouseLocationInput) {
  const body: Record<string, unknown> = {};
  if (patch.parentLocationId !== undefined) body.parentLocationId = patch.parentLocationId;
  if (patch.code !== undefined) body.code = patch.code;
  if (patch.nameAr !== undefined) body.nameAr = patch.nameAr;
  if (patch.nameEn !== undefined) body.nameEn = patch.nameEn ?? null;
  if (patch.locationType !== undefined) body.locationType = patch.locationType;
  if (patch.storageCategory !== undefined) body.storageCategory = patch.storageCategory ?? null;
  if (patch.barcode !== undefined) body.barcode = patch.barcode ?? null;
  if (patch.replenish !== undefined) body.replenish = patch.replenish;
  if (patch.cycleCountFrequencyDays !== undefined) {
    body.cycleCountFrequencyDays = patch.cycleCountFrequencyDays;
  }
  if (patch.lastCountAt !== undefined) body.lastCountAt = patch.lastCountAt ?? null;
  if (patch.nextCountAt !== undefined) body.nextCountAt = patch.nextCountAt ?? null;
  if (patch.removalStrategy !== undefined) body.removalStrategy = patch.removalStrategy;
  if (patch.aisle !== undefined) body.aisle = patch.aisle ?? null;
  if (patch.rack !== undefined) body.rack = patch.rack ?? null;
  if (patch.bin !== undefined) body.bin = patch.bin ?? null;
  if (patch.isActive !== undefined) body.isActive = patch.isActive;
  if (patch.isSystem !== undefined) body.isSystem = patch.isSystem;
  return body;
}

export const warehouseLocationsApi: AdminWarehouseLocationsPort = {
  async getAll(query: WarehouseLocationListQuery) {
    const result = await apiRequest<PaginatedResult<WarehouseLocationDto>>(
      '/inventory/warehouse-locations',
      {
        query: {
          companyId: query.companyId,
          warehouseId: query.warehouseId,
          search: query.search,
          page: query.page ?? 1,
          limit: query.limit ?? 200,
          archiveScope: 'active',
        },
      },
    );
    return {
      items: (result.items ?? []).map(mapLocation),
      pagination: result.pagination,
    };
  },

  async getById(_companyId, id) {
    try {
      const dto = await apiRequest<WarehouseLocationDto>(`/inventory/warehouse-locations/${id}`);
      return dto?.id ? mapLocation(dto) : null;
    } catch {
      return null;
    }
  },

  async create(input: CreateWarehouseLocationInput) {
    const dto = await apiRequest<WarehouseLocationDto>('/inventory/warehouse-locations', {
      method: 'POST',
      body: toCreateBody(input),
    });
    return mapLocation(dto);
  },

  async update(_companyId, id, patch: UpdateWarehouseLocationInput) {
    const dto = await apiRequest<WarehouseLocationDto>(`/inventory/warehouse-locations/${id}`, {
      method: 'PATCH',
      body: toUpdateBody(patch),
    });
    return dto?.id ? mapLocation(dto) : null;
  },

  async remove(_companyId, id) {
    await apiRequest<void>(`/inventory/warehouse-locations/${id}`, { method: 'DELETE' });
    return true;
  },
};
