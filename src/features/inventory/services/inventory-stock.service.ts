/**
 * Sole public entry point for mutating inventory balances.
 *
 * Rule: Sales, warehouse ops, and any future module must call this service.
 * Do not call locationStockApi.adjust / .deduct / .reserve from outside this module.
 *
 * Flow for every mutation: Inventory Ledger (history) → LocationStock (live) → product qty cache.
 */
import { locationStockApi } from '@/features/inventory/admin/stock/lib/api/location-stock';
import { warehouseOperationsApi } from '@/features/inventory/admin/operations/lib/api/warehouse-operations';
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
   * Sales fulfillment: create a done `issue` operation (real UUIDs) then post ledger.
   */
  async issueForShipment(input: IssueForShipmentInput): Promise<void> {
    if (!input.productId?.trim()) {
      throw new Error('productId مطلوب لصرف المخزون.');
    }
    if (input.lines.length === 0) {
      throw new Error('لا توجد بنود صرف.');
    }

    const positiveLines = input.lines.filter((line) => line.quantity > 0);
    if (positiveLines.length === 0) {
      throw new Error('لا توجد كميات صرف موجبة.');
    }

    // One warehouse document per warehouse in the allocation.
    const byWarehouse = new Map<string, ShipmentIssueLine[]>();
    for (const line of positiveLines) {
      const list = byWarehouse.get(line.warehouseId) ?? [];
      list.push(line);
      byWarehouse.set(line.warehouseId, list);
    }

    const now = new Date().toISOString();
    for (const [warehouseId, lines] of byWarehouse) {
      await warehouseOperationsApi.create({
        companyId: input.companyId,
        warehouseId,
        kind: 'issue',
        reference: `SO/${input.orderNumber}`,
        status: 'done',
        occurredAt: now,
        sourceDocument: input.orderNumber,
        notes: `صرف شحن طلب ${input.orderNumber}`,
        lines: lines.map((line, index) => ({
          id: `tmp-sales-${index}`,
          productId: input.productId,
          productName: input.productName,
          sku: input.sku,
          variantId: line.variantId ?? input.variantId,
          demandQuantity: line.quantity,
          quantity: line.quantity,
          fromLocationId: line.locationId,
        })),
      });
    }

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
