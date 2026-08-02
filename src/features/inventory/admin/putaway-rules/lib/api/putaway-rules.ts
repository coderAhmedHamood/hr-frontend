import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import {
  mockWarehouseLocationsStore,
  mockWarehousesStore,
} from '@/features/inventory/shared/lib/adapters/mock-inventory-store';
import type {
  CreatePutawayRuleInput,
  PutawayLocationOption,
  PutawayRule,
  PutawayRuleListQuery,
  UpdatePutawayRuleInput,
} from '@/features/inventory/domain/types/putaway-rule';
import putawaySeed from '@/features/inventory/shared/lib/mock/putaway-rules.json';

const repository = createMockRepository<PutawayRule>(putawaySeed as PutawayRule[]);

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeInput(input: CreatePutawayRuleInput): CreatePutawayRuleInput {
  if (input.appliesTo === 'product') {
    return { ...input, categoryId: null, productId: input.productId || null };
  }
  if (input.appliesTo === 'category') {
    return { ...input, productId: null, categoryId: input.categoryId || null };
  }
  return { ...input, productId: null, categoryId: null };
}

export const putawayRulesApi = {
  getAll(query: PutawayRuleListQuery) {
    return repository.list(
      query,
      (item, q) => {
        if (q.productId && item.productId !== q.productId) return false;
        if (q.categoryId && item.categoryId !== q.categoryId) return false;
        if (q.warehouseId && item.warehouseId !== q.warehouseId) return false;
        return true;
      },
      (a, b) => {
        const bySeq = (a.sequence ?? 10) - (b.sequence ?? 10);
        if (bySeq !== 0) return bySeq;
        return b.updatedAt.localeCompare(a.updatedAt);
      },
    );
  },

  getById(companyId: string, id: string) {
    return repository.getById(companyId, id);
  },

  create(input: CreatePutawayRuleInput) {
    const now = new Date().toISOString();
    return repository.create({
      ...normalizeInput(input),
      id: newId('putaway'),
      createdAt: now,
      updatedAt: now,
    });
  },

  update(companyId: string, id: string, patch: UpdatePutawayRuleInput) {
    const normalized = patch.appliesTo
      ? normalizeInput({ ...(patch as CreatePutawayRuleInput) })
      : patch;
    return repository.update(companyId, id, {
      ...normalized,
      updatedAt: new Date().toISOString(),
    });
  },

  remove(companyId: string, id: string) {
    return repository.remove(companyId, id);
  },

  async listLocationOptions(companyId: string): Promise<PutawayLocationOption[]> {
    const [warehouses, locations] = await Promise.all([
      mockWarehousesStore.list({ companyId, page: 1, limit: 200 }),
      mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 }),
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
