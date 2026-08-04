/**
 * Sole public entry point for mutating inventory balances.
 *
 * Rule: Sales, warehouse ops, and any future module must call this service.
 * Do not call locationStockApi.adjust / .deduct / .reserve from outside this module.
 *
 * Flow for every mutation: Inventory Ledger (history) → LocationStock (live) → product qty cache.
 */
import { locationStockApi } from '@/features/inventory/admin/stock/lib/api/location-stock';
import { inventoryLedgerApi } from '@/features/inventory/admin/operations/lib/api/inventory-ledger';
import type { InventoryLedgerEntry } from '@/features/inventory/domain/types/inventory-ledger';
import type { WarehouseOperation } from '@/features/inventory/domain/types/warehouse';
import {
  applyDoneOperationToStock,
  reverseDoneOperationStock,
  syncProductQuantityFromWarehouse,
} from '@/features/inventory/admin/operations/lib/apply-operation-stock';

export type ShipmentIssueLine = {
  warehouseId: string;
  locationId: string;
  quantity: number;
  variantId?: string;
};

export type IssueForShipmentInput = {
  companyId: string;
  productId: string;
  productName: string;
  sku?: string;
  variantId?: string;
  orderId: string;
  orderNumber: string;
  lines: ShipmentIssueLine[];
};

function assertOperationLinesHaveProductId(operation: WarehouseOperation): void {
  const missing = operation.lines.filter((line) => !line.productId?.trim());
  if (missing.length > 0) {
    throw new Error('لا يمكن تطبيق حركة مخزون بدون ربط كل بند بمنتج (productId).');
  }
}

async function appendLedgerAndAdjust(
  drafts: Omit<InventoryLedgerEntry, 'id' | 'createdAt'>[],
): Promise<void> {
  if (drafts.length === 0) return;
  await inventoryLedgerApi.append(drafts);
  for (const entry of drafts) {
    await locationStockApi.adjust({
      companyId: entry.companyId,
      productId: entry.productId,
      variantId: entry.variantId,
      warehouseId: entry.warehouseId,
      locationId: entry.locationId,
      delta: entry.quantityDelta,
    });
  }
}

export const inventoryStockService = {
  /** Validate warehouse document → ledger + LocationStock + product cache. */
  async applyDoneOperation(operation: WarehouseOperation): Promise<void> {
    assertOperationLinesHaveProductId(operation);
    await applyDoneOperationToStock(operation);
  },

  /** Undo a validated document. */
  async reverseDoneOperation(operation: WarehouseOperation): Promise<void> {
    await reverseDoneOperationStock(operation);
  },

  /**
   * Sales fulfillment: deduct allocated stock via ledger (kind=issue).
   * Replaces direct locationStockApi.deduct from orders.
   */
  async issueForShipment(input: IssueForShipmentInput): Promise<void> {
    if (!input.productId?.trim()) {
      throw new Error('productId مطلوب لصرف المخزون.');
    }
    if (input.lines.length === 0) {
      throw new Error('لا توجد بنود صرف.');
    }

    const now = new Date().toISOString();
    const operationId = `sales-${input.orderId}`;
    const drafts: Omit<InventoryLedgerEntry, 'id' | 'createdAt'>[] = [];

    for (const [index, line] of input.lines.entries()) {
      if (line.quantity <= 0) continue;
      drafts.push({
        companyId: input.companyId,
        occurredAt: now,
        operationId,
        operationLineId: `${operationId}-L${index + 1}`,
        operationReference: `SO/${input.orderNumber}`,
        kind: 'issue',
        productId: input.productId,
        productName: input.productName,
        variantId: line.variantId ?? input.variantId,
        sku: input.sku,
        warehouseId: line.warehouseId,
        locationId: line.locationId,
        quantityDelta: -line.quantity,
        sourceDocument: input.orderNumber,
        notes: `صرف شحن طلب ${input.orderNumber}`,
      });
    }

    await appendLedgerAndAdjust(drafts);
    await syncProductQuantityFromWarehouse(input.companyId, input.productId);
  },

  /** Reserve (+) or release (−) without changing on-hand. */
  async reserve(input: Parameters<typeof locationStockApi.reserve>[0]) {
    return locationStockApi.reserve(input);
  },

  // ── Reads (safe to call from Sales / UI) ─────────────────────────────────
  getAvailability: locationStockApi.getAvailability.bind(locationStockApi),
  getStockSummary: locationStockApi.getStockSummary.bind(locationStockApi),
  getOnHandTotal: locationStockApi.getOnHandTotal.bind(locationStockApi),
  getOnHandByVariant: locationStockApi.getOnHandByVariant.bind(locationStockApi),
  getQuantityAtLocation: locationStockApi.getQuantityAtLocation.bind(locationStockApi),
  listLocationStock: locationStockApi.list.bind(locationStockApi),
};
