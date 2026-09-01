import { locationStockApi } from '@/features/inventory/admin/stock/lib/api/location-stock';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import { inventoryLedgerApi } from '@/features/inventory/admin/operations/lib/api/inventory-ledger';
import type { InventoryLedgerEntry } from '@/features/inventory/domain/types/inventory-ledger';
import type { WarehouseOperation, WarehouseOperationLine } from '@/features/inventory/domain/types/warehouse';
import { buildStockDeltasForLine } from '@/features/inventory/admin/operations/lib/build-operation-stock-deltas';
import { assertSufficientStockForOperation } from '@/features/inventory/admin/operations/lib/validate-operation-stock';

function baseLedgerFields(
  operation: WarehouseOperation,
  line: WarehouseOperationLine,
): Pick<
  InventoryLedgerEntry,
  | 'companyId'
  | 'occurredAt'
  | 'operationId'
  | 'operationLineId'
  | 'operationReference'
  | 'kind'
  | 'productId'
  | 'productName'
  | 'variantId'
  | 'sku'
  | 'sourceDocument'
  | 'partnerName'
  | 'notes'
> {
  return {
    companyId: operation.companyId,
    occurredAt: operation.occurredAt,
    operationId: operation.id,
    operationLineId: line.id,
    operationReference: operation.reference,
    kind: operation.kind,
    productId: line.productId!,
    productName: line.productName,
    variantId: line.variantId,
    sku: line.sku,
    sourceDocument: operation.sourceDocument,
    partnerName: operation.partnerName,
    notes: line.notes ?? operation.notes,
  };
}

/** Apply a validated (done) warehouse operation: ledger first, then LocationStock cache. */
export async function applyDoneOperationToStock(operation: WarehouseOperation): Promise<void> {
  await assertSufficientStockForOperation(operation);

  const companyId = operation.companyId;
  const touchedProductIds = new Set<string>();
  const ledgerDrafts: Omit<InventoryLedgerEntry, 'id' | 'createdAt'>[] = [];

  for (const line of operation.lines) {
    if (!line.productId?.trim()) {
      throw new Error(
        `البند «${line.productName}» غير مربوط بمنتج (productId) — لا يمكن تطبيق الحركة.`,
      );
    }
    const deltas = await buildStockDeltasForLine(operation, line);
    for (const delta of deltas) {
      ledgerDrafts.push({
        ...baseLedgerFields(operation, line),
        warehouseId: delta.warehouseId,
        locationId: delta.locationId,
        quantityDelta: delta.delta,
        counterpartLocationId: delta.counterpartLocationId,
        counterpartWarehouseId: delta.counterpartWarehouseId,
      });
    }
    if (deltas.length > 0) touchedProductIds.add(line.productId);
  }

  if (ledgerDrafts.length > 0) {
    await inventoryLedgerApi.append(ledgerDrafts);
  }

  for (const entry of ledgerDrafts) {
    await locationStockApi.adjust({
      companyId,
      productId: entry.productId,
      variantId: entry.variantId,
      warehouseId: entry.warehouseId,
      locationId: entry.locationId,
      delta: entry.quantityDelta,
    });
  }

  for (const productId of touchedProductIds) {
    await syncProductQuantityFromWarehouse(companyId, productId);
  }
}

/**
 * Reverse a previously done operation: append compensating ledger rows and undo stock.
 * Used when undoing a validated document.
 */
export async function reverseDoneOperationStock(operation: WarehouseOperation): Promise<void> {
  const existing = await inventoryLedgerApi.listByOperation(operation.companyId, operation.id);
  if (existing.length === 0) return;

  const now = new Date().toISOString();
  const reversals: Omit<InventoryLedgerEntry, 'id' | 'createdAt'>[] = existing.map((entry) => ({
    companyId: entry.companyId,
    occurredAt: now,
    operationId: operation.id,
    operationLineId: entry.operationLineId,
    operationReference: `${operation.reference}-REV`,
    kind: entry.kind,
    productId: entry.productId,
    productName: entry.productName,
    variantId: entry.variantId,
    sku: entry.sku,
    warehouseId: entry.warehouseId,
    locationId: entry.locationId,
    quantityDelta: -entry.quantityDelta,
    counterpartLocationId: entry.counterpartLocationId,
    counterpartWarehouseId: entry.counterpartWarehouseId,
    sourceDocument: operation.sourceDocument,
    partnerName: operation.partnerName,
    notes: `عكس حركة ${operation.reference}`,
  }));

  await inventoryLedgerApi.append(reversals);

  const touched = new Set<string>();
  for (const entry of reversals) {
    await locationStockApi.adjust({
      companyId: entry.companyId,
      productId: entry.productId,
      variantId: entry.variantId,
      warehouseId: entry.warehouseId,
      locationId: entry.locationId,
      delta: entry.quantityDelta,
    });
    touched.add(entry.productId);
  }

  for (const productId of touched) {
    await syncProductQuantityFromWarehouse(operation.companyId, productId);
  }
}

/** Push warehouse on-hand totals into product.inventory cache (not source of truth). */
export async function syncProductQuantityFromWarehouse(
  companyId: string,
  productId: string,
): Promise<void> {
  const product = await productsApi.getById(companyId, productId);
  if (!product) return;

  const { total, byVariant } = await locationStockApi.getOnHandByVariant(companyId, productId);
  const variants = product.variants?.map((variant) => {
    const qty = byVariant[variant.id] ?? 0;
    return {
      ...variant,
      quantity: qty,
      stockStatus:
        qty > 0
          ? ('in_stock' as const)
          : variant.stockStatus === 'preorder'
            ? variant.stockStatus
            : ('out_of_stock' as const),
    };
  });

  const hasVariants = Boolean(variants && variants.length > 0);
  const quantity = hasVariants
    ? (variants ?? []).reduce((sum, variant) => sum + variant.quantity, 0)
    : (byVariant[''] ?? total);

  await productsApi.update(companyId, productId, {
    inventory: {
      ...product.inventory,
      quantity,
    },
    ...(variants ? { variants } : {}),
    stockStatus:
      quantity > 0
        ? 'in_stock'
        : product.stockStatus === 'preorder' || product.stockStatus === 'discontinued'
          ? product.stockStatus
          : 'out_of_stock',
  });
}
