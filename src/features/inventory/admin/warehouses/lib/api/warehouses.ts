import {
  mockWarehouseLocationsStore,
  mockWarehousesStore,
} from '@/features/inventory/shared/lib/adapters/mock-inventory-store';
import { buildDefaultWarehouseLocations } from '@/features/inventory/admin/warehouses/lib/default-warehouse-locations';
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseListQuery,
} from '@/features/inventory/domain/types/warehouse';
import type { AdminWarehousesPort } from '@/features/inventory/domain/ports/inventory.ports';

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const warehousesApi: AdminWarehousesPort = {
  getAll(query: WarehouseListQuery) {
    return mockWarehousesStore.list(query, (item, q) => {
      if (!q.search) return true;
      const search = q.search.toLowerCase();
      return (
        item.nameAr.toLowerCase().includes(search) ||
        item.code.toLowerCase().includes(search) ||
        (item.nameEn?.toLowerCase().includes(search) ?? false)
      );
    });
  },
  getById(companyId, id) {
    return mockWarehousesStore.getById(companyId, id);
  },
  async create(input: CreateWarehouseInput) {
    const now = new Date().toISOString();
    const warehouse = await mockWarehousesStore.create({
      ...input,
      id: newId('wh'),
      createdAt: now,
      updatedAt: now,
    });

    const drafts = buildDefaultWarehouseLocations(warehouse);
    const idByTempKey = new Map<string, string>();

    // Parents first so Stock can link to the warehouse view location.
    for (const draft of drafts) {
      const { tempKey, parentTempKey, ...location } = draft;
      const id = newId('loc');
      idByTempKey.set(tempKey, id);
      const parentLocationId = parentTempKey ? (idByTempKey.get(parentTempKey) ?? null) : null;

      await mockWarehouseLocationsStore.create({
        ...location,
        id,
        parentLocationId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return warehouse;
  },
  update(companyId, id, patch: UpdateWarehouseInput) {
    return mockWarehousesStore.update(companyId, id, { ...patch, updatedAt: new Date().toISOString() });
  },
  remove(companyId, id) {
    return mockWarehousesStore.remove(companyId, id);
  },
};
