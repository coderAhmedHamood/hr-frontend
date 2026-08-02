import { createMockRepository } from '@/features/ecommerce/shared/lib/mock/repository';
import type {
  InventoryLedgerEntry,
  InventoryLedgerListQuery,
} from '@/features/inventory/domain/types/inventory-ledger';
import ledgerSeed from '@/features/inventory/shared/lib/mock/inventory-ledger.json';

const repository = createMockRepository<InventoryLedgerEntry>(
  ledgerSeed as InventoryLedgerEntry[],
);

function newId() {
  return `led-${Math.random().toString(36).slice(2, 10)}`;
}

export const inventoryLedgerApi = {
  list(query: InventoryLedgerListQuery) {
    return repository.list(
      query,
      (item, q) => {
        if (query.warehouseId && item.warehouseId !== query.warehouseId) return false;
        if (query.productId && item.productId !== query.productId) return false;
        if (query.locationId && item.locationId !== query.locationId) return false;
        if (query.kind && item.kind !== query.kind) return false;
        if (query.operationId && item.operationId !== query.operationId) return false;
        if (!query.search) return true;
        const search = query.search.toLowerCase();
        return (
          item.operationReference.toLowerCase().includes(search) ||
          item.productName.toLowerCase().includes(search) ||
          (item.sku?.toLowerCase().includes(search) ?? false) ||
          (item.sourceDocument?.toLowerCase().includes(search) ?? false)
        );
      },
      (a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.createdAt.localeCompare(a.createdAt),
    );
  },

  async append(entries: Omit<InventoryLedgerEntry, 'id' | 'createdAt'>[]): Promise<InventoryLedgerEntry[]> {
    const now = new Date().toISOString();
    const created: InventoryLedgerEntry[] = [];
    for (const entry of entries) {
      const row = await repository.create({
        ...entry,
        id: newId(),
        createdAt: now,
      });
      created.push(row);
    }
    return created;
  },

  async listByOperation(companyId: string, operationId: string): Promise<InventoryLedgerEntry[]> {
    const page = await this.list({ companyId, operationId, page: 1, limit: 500 });
    return page.items;
  },
};
