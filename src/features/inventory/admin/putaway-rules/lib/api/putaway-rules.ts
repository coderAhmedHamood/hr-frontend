import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { warehousesApi } from '@/features/inventory/admin/warehouses/lib/api/warehouses';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';
import type {
  CreatePutawayRuleInput,
  PutawayLocationOption,
  PutawayRule,
  PutawayRuleListQuery,
  UpdatePutawayRuleInput,
} from '@/features/inventory/domain/types/putaway-rule';

type PutawayRuleDto = PutawayRule & {
  isArchived?: boolean;
  archivedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

function normalizeInput(input: CreatePutawayRuleInput): CreatePutawayRuleInput {
  if (input.appliesTo === 'product') {
    return { ...input, categoryId: null, productId: input.productId || null };
  }
  if (input.appliesTo === 'category') {
    return { ...input, productId: null, categoryId: input.categoryId || null };
  }
  return { ...input, productId: null, categoryId: null };
}

function mapRule(dto: PutawayRuleDto): PutawayRule {
  return {
    id: dto.id,
    companyId: dto.companyId,
    warehouseId: dto.warehouseId,
    arriveLocationId: dto.arriveLocationId,
    appliesTo: dto.appliesTo,
    productId: dto.productId ?? null,
    categoryId: dto.categoryId ?? null,
    packagingType: dto.packagingType ?? null,
    storeLocationId: dto.storeLocationId,
    subLocationId: dto.subLocationId ?? null,
    sequence: dto.sequence,
    isActive: dto.isActive,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function toCreateBody(input: CreatePutawayRuleInput) {
  const normalized = normalizeInput(input);
  return {
    companyId: normalized.companyId,
    warehouseId: normalized.warehouseId,
    arriveLocationId: normalized.arriveLocationId,
    appliesTo: normalized.appliesTo,
    productId: normalized.productId ?? null,
    categoryId: normalized.categoryId ?? null,
    packagingType: normalized.packagingType ?? null,
    storeLocationId: normalized.storeLocationId,
    subLocationId: normalized.subLocationId ?? null,
    sequence: normalized.sequence,
    isActive: normalized.isActive,
  };
}

function toUpdateBody(patch: UpdatePutawayRuleInput) {
  const normalized = patch.appliesTo
    ? normalizeInput({ ...(patch as CreatePutawayRuleInput) })
    : patch;
  const body: Record<string, unknown> = {};
  if (normalized.arriveLocationId !== undefined) body.arriveLocationId = normalized.arriveLocationId;
  if (normalized.appliesTo !== undefined) body.appliesTo = normalized.appliesTo;
  if (normalized.productId !== undefined) body.productId = normalized.productId;
  if (normalized.categoryId !== undefined) body.categoryId = normalized.categoryId;
  if (normalized.packagingType !== undefined) body.packagingType = normalized.packagingType;
  if (normalized.storeLocationId !== undefined) body.storeLocationId = normalized.storeLocationId;
  if (normalized.subLocationId !== undefined) body.subLocationId = normalized.subLocationId;
  if (normalized.sequence !== undefined) body.sequence = normalized.sequence;
  if (normalized.isActive !== undefined) body.isActive = normalized.isActive;
  return body;
}

export const putawayRulesApi = {
  async getAll(query: PutawayRuleListQuery) {
    const result = await apiRequest<PaginatedResult<PutawayRuleDto>>('/inventory/putaway-rules', {
      query: {
        companyId: query.companyId,
        productId: query.productId,
        categoryId: query.categoryId,
        warehouseId: query.warehouseId,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        archiveScope: 'active',
      },
    });
    return {
      items: (result.items ?? []).map(mapRule),
      pagination: result.pagination,
    };
  },

  async getById(_companyId: string, id: string) {
    try {
      const dto = await apiRequest<PutawayRuleDto>(`/inventory/putaway-rules/${id}`);
      return dto?.id ? mapRule(dto) : null;
    } catch {
      return null;
    }
  },

  async create(input: CreatePutawayRuleInput) {
    const dto = await apiRequest<PutawayRuleDto>('/inventory/putaway-rules', {
      method: 'POST',
      body: toCreateBody(input),
    });
    return mapRule(dto);
  },

  async update(_companyId: string, id: string, patch: UpdatePutawayRuleInput) {
    const dto = await apiRequest<PutawayRuleDto>(`/inventory/putaway-rules/${id}`, {
      method: 'PATCH',
      body: toUpdateBody(patch),
    });
    return dto?.id ? mapRule(dto) : null;
  },

  async remove(_companyId: string, id: string) {
    await apiRequest<void>(`/inventory/putaway-rules/${id}`, { method: 'DELETE' });
    return true;
  },

  async listLocationOptions(companyId: string): Promise<PutawayLocationOption[]> {
    const [warehouses, locations] = await Promise.all([
      warehousesApi.getAll({ companyId, page: 1, limit: 200 }),
      warehouseLocationsApi.getAll({ companyId, page: 1, limit: 500 }),
    ]);
    const warehouseMap = new Map(warehouses.items.map((w) => [w.id, w]));
    return locations.items
      .filter((location) => location.isActive)
      .map((location) => ({
        id: location.id,
        warehouseId: location.warehouseId,
        warehouseNameAr: warehouseMap.get(location.warehouseId)?.nameAr ?? location.warehouseId,
        nameAr: location.nameAr,
        code: location.code,
        locationType: location.locationType,
        parentLocationId: location.parentLocationId ?? null,
        isActive: location.isActive,
      }))
      .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
  },
};
