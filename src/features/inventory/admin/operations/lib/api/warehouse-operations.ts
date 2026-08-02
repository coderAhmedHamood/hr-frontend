import { mockWarehouseOperationsStore } from '@/features/inventory/shared/lib/adapters/mock-inventory-store';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import type {
  CreateWarehouseOperationInput,
  UpdateWarehouseOperationInput,
  WarehouseOperation,
  WarehouseOperationListQuery,
} from '@/features/inventory/domain/types/warehouse';
import type { AdminWarehouseOperationsPort } from '@/features/inventory/domain/ports/inventory.ports';

function assertLinesLinkedToProduct(
  lines: CreateWarehouseOperationInput['lines'] | WarehouseOperation['lines'],
): void {
  const missing = lines.filter((line) => !line.productId?.trim());
  if (missing.length > 0) {
    throw new Error('كل بند في مستند المخزون يجب أن يرتبط بمنتج (productId).');
  }
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeOperation(item: WarehouseOperation): WarehouseOperation {
  const status = (item.status as string) === 'posted' ? 'done' : item.status;
  return {
    ...item,
    status,
    lines: item.lines.map((line) => ({
      ...line,
      demandQuantity: line.demandQuantity ?? line.quantity,
      quantity: line.quantity,
    })),
  };
}

export const warehouseOperationsApi: AdminWarehouseOperationsPort = {
  getAll(query: WarehouseOperationListQuery) {
    return mockWarehouseOperationsStore
      .list(
        query,
        (item, q) => {
          if (q.warehouseId && item.warehouseId !== q.warehouseId) return false;
          if (q.kind && item.kind !== q.kind) return false;
          if (
            q.status &&
            item.status !== q.status &&
            !(q.status === 'done' && (item.status as string) === 'posted')
          ) {
            return false;
          }
          if (q.productId && !item.lines.some((line) => line.productId === q.productId)) return false;
          if (!q.search) return true;
          const search = q.search.toLowerCase();
          return (
            item.reference.toLowerCase().includes(search) ||
            (item.notes?.toLowerCase().includes(search) ?? false) ||
            item.lines.some(
              (line) =>
                line.productName.toLowerCase().includes(search) ||
                (line.sku?.toLowerCase().includes(search) ?? false),
            )
          );
        },
        (a, b) => b.occurredAt.localeCompare(a.occurredAt),
      )
      .then((page) => ({
        ...page,
        items: page.items.map(normalizeOperation),
      }));
  },
  getById(companyId, id) {
    return mockWarehouseOperationsStore.getById(companyId, id).then((item) =>
      item ? normalizeOperation(item) : null,
    );
  },
  create(input: CreateWarehouseOperationInput) {
    assertLinesLinkedToProduct(input.lines);
    const now = new Date().toISOString();
    return mockWarehouseOperationsStore
      .create({
        ...input,
        lines: input.lines.map((line) => ({
          ...line,
          demandQuantity: line.demandQuantity ?? line.quantity,
        })),
        id: newId('op'),
        createdAt: now,
        updatedAt: now,
      })
      .then(normalizeOperation);
  },
  async update(companyId, id, patch: UpdateWarehouseOperationInput) {
    if (patch.lines) {
      assertLinesLinkedToProduct(patch.lines);
    }
    const before = await mockWarehouseOperationsStore.getById(companyId, id);
    const beforeNorm = before ? normalizeOperation(before) : null;
    const updated = await mockWarehouseOperationsStore.update(companyId, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) return null;
    const normalized = normalizeOperation(updated);
    const wasDone = beforeNorm?.status === 'done';
    const nowDone = normalized.status === 'done';

    if (!wasDone && nowDone) {
      await inventoryStockService.applyDoneOperation(normalized);
    }

    if (wasDone && !nowDone && beforeNorm) {
      await inventoryStockService.reverseDoneOperation(beforeNorm);
    }

    return normalized;
  },
  remove(companyId, id) {
    return mockWarehouseOperationsStore.remove(companyId, id);
  },
};
