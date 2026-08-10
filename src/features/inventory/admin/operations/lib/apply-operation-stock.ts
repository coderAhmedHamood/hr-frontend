import { locationStockApi } from '@/features/inventory/admin/stock/lib/api/location-stock';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import { inventoryLedgerApi } from '@/features/inventory/admin/operations/lib/api/inventory-ledger';
import { mockWarehouseLocationsStore } from '@/features/inventory/shared/lib/adapters/mock-inventory-store';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { InventoryLedgerEntry } from '@/features/inventory/domain/types/inventory-ledger';
import type { WarehouseOperation, WarehouseOperationLine } from '@/features/inventory/domain/types/warehouse';

type StockDelta = {
  warehouseId: string;
  locationId: string;
  delta: number;
  counterpartLocationId?: string;
  counterpartWarehouseId?: string;
};

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

async function findTransitLocationId(companyId: string, warehouseId: string): Promise<string | null> {
  const locations = await mockWarehouseLocationsStore.list({ companyId, page: 1, limit: 500 });
  const transit = locations.items.find(
    (location) =>
      location.warehouseId === warehouseId &&
      location.locationType === 'transit' &&
      location.isActive,
  );
  return transit?.id ?? null;
}

/**
 * Build stock deltas for a validated operation.
 * Transfers post via Transit: Source → Transit(source WH) → Dest.
 */
async function buildStockDeltas(
  operation: WarehouseOperation,
  line: WarehouseOperationLine,
): Promise<StockDelta[]> {
  const effect = WAREHOUSE_OPERATION_KIND_META[operation.kind].stockEffect;
  const qty = line.quantity;
  if (qty < 0) return [];

  if (effect === 'inbound') {
    if (!line.toLocationId || qty <= 0) return [];
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.toLocationId,
        delta: qty,
      },
    ];
  }

  if (effect === 'outbound') {
    if (!line.fromLocationId || qty <= 0) return [];
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.fromLocationId,
        delta: -qty,
      },
    ];
  }

  if (effect === 'move') {
    if (!line.fromLocationId || !line.toLocationId || qty <= 0) return [];
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.fromLocationId,
        delta: -qty,
        counterpartLocationId: line.toLocationId,
        counterpartWarehouseId: operation.warehouseId,
      },
      {
        warehouseId: operation.warehouseId,
        locationId: line.toLocationId,
        delta: qty,
        counterpartLocationId: line.fromLocationId,
        counterpartWarehouseId: operation.warehouseId,
      },
    ];
  }

  if (effect === 'transfer') {
    if (!line.fromLocationId || !line.toLocationId || qty <= 0) return [];
    const destWarehouseId = operation.destinationWarehouseId || operation.warehouseId;
    const transitId = await findTransitLocationId(operation.companyId, operation.warehouseId);

    if (!transitId) {
      // Fallback: direct WH→WH if transit missing
      return [
        {
          warehouseId: operation.warehouseId,
          locationId: line.fromLocationId,
          delta: -qty,
          counterpartLocationId: line.toLocationId,
          counterpartWarehouseId: destWarehouseId,
        },
        {
          warehouseId: destWarehouseId,
          locationId: line.toLocationId,
          delta: qty,
          counterpartLocationId: line.fromLocationId,
          counterpartWarehouseId: operation.warehouseId,
        },
      ];
    }

    // Source → Transit → Dest
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.fromLocationId,
        delta: -qty,
        counterpartLocationId: transitId,
        counterpartWarehouseId: operation.warehouseId,
      },
      {
        warehouseId: operation.warehouseId,
        locationId: transitId,
        delta: qty,
        counterpartLocationId: line.fromLocationId,
        counterpartWarehouseId: operation.warehouseId,
      },
      {
        warehouseId: operation.warehouseId,
        locationId: transitId,
        delta: -qty,
        counterpartLocationId: line.toLocationId,
        counterpartWarehouseId: destWarehouseId,
      },
      {
        warehouseId: destWarehouseId,
        locationId: line.toLocationId,
        delta: qty,
        counterpartLocationId: transitId,
        counterpartWarehouseId: operation.warehouseId,
      },
    ];
  }

  if (effect === 'adjust_set') {
    if (!line.toLocationId) return [];
    const theoretical = line.demandQuantity ?? 0;
    const counted = line.quantity;
    const delta = counted - theoretical;
    if (delta === 0) return [];
    return [
      {
        warehouseId: operation.warehouseId,
        locationId: line.toLocationId,
        delta,
      },
    ];
  }

  return [];
}

/** Apply a validated (done) warehouse operation: ledger first, then LocationStock cache. */
export async function applyDoneOperationToStock(operation: WarehouseOperation): Promise<void> {
  const companyId = operation.companyId;
  const touchedProductIds = new Set<string>();
  const ledgerDrafts: Omit<InventoryLedgerEntry, 'id' | 'createdAt'>[] = [];

  for (const line of operation.lines) {
    if (!line.productId?.trim()) {
      throw new Error(
        `البند «${line.productName}» غير مربوط بمنتج (productId) — لا يمكن تطبيق الحركة.`,
      );
    }
    const deltas = await buildStockDeltas(operation, line);
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
