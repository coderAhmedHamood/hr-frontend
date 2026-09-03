import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { WarehouseOperation, WarehouseOperationKind, WarehouseOperationLine } from '@/features/inventory/domain/types/warehouse';
import { buildStockDeltasForLine } from '@/features/inventory/admin/operations/lib/build-operation-stock-deltas';

export type StockShortageIssue = {
  productName: string;
  locationId: string;
  requested: number;
  available: number;
};

function stockBucketKey(parts: {
  productId: string;
  variantId?: string;
  warehouseId: string;
  locationId: string;
}): string {
  return [parts.productId, parts.variantId ?? '', parts.warehouseId, parts.locationId].join('|');
}

function needsSourceStockCheck(kind: WarehouseOperationKind): boolean {
  const effect = WAREHOUSE_OPERATION_KIND_META[kind].stockEffect;
  return effect === 'outbound' || effect === 'move' || effect === 'transfer';
}

/**
 * Aggregate the document's net effect per product/variant/location before posting.
 * Netting (not just the outgoing side) matters for transfers, which pass through a
 * transit location: it receives and releases the same quantity within one document,
 * so counting only its outgoing leg would report a shortage that never happens.
 */
export async function collectStockShortages(
  operation: Pick<WarehouseOperation, 'companyId' | 'warehouseId' | 'kind' | 'destinationWarehouseId' | 'lines'>,
): Promise<StockShortageIssue[]> {
  if (!needsSourceStockCheck(operation.kind)) return [];

  const netByBucket = new Map<
    string,
    { productName: string; locationId: string; net: number; companyId: string; productId: string; variantId?: string }
  >();

  for (const line of operation.lines) {
    if (!line.productId?.trim()) continue;
    const deltas = await buildStockDeltasForLine(operation as WarehouseOperation, line);
    for (const delta of deltas) {
      const key = stockBucketKey({
        productId: line.productId,
        variantId: line.variantId,
        warehouseId: delta.warehouseId,
        locationId: delta.locationId,
      });
      const existing = netByBucket.get(key);
      if (existing) {
        existing.net += delta.delta;
      } else {
        netByBucket.set(key, {
          productName: line.productName,
          locationId: delta.locationId,
          net: delta.delta,
          companyId: operation.companyId,
          productId: line.productId,
          variantId: line.variantId,
        });
      }
    }
  }

  const issues: StockShortageIssue[] = [];
  for (const bucket of netByBucket.values()) {
    if (bucket.net >= -1e-9) continue;
    const requested = -bucket.net;
    const available = await inventoryStockService.getQuantityAtLocation(
      bucket.companyId,
      bucket.productId,
      bucket.locationId,
      bucket.variantId,
    );
    if (requested > available + 1e-9) {
      issues.push({
        productName: bucket.productName,
        locationId: bucket.locationId,
        requested,
        available: Math.max(0, available),
      });
    }
  }
  return issues;
}

export async function assertSufficientStockForOperation(operation: WarehouseOperation): Promise<void> {
  const issues = await collectStockShortages(operation);
  if (issues.length === 0) return;
  const first = issues[0]!;
  throw new Error(
    `«${first.productName}»: الكمية المطلوبة (${first.requested}) أكبر من المتاح في الموقع (${first.available}).`,
  );
}

export function formatStockShortageMessage(issue: StockShortageIssue): string {
  return `«${issue.productName}»: الكمية المطلوبة (${issue.requested}) أكبر من المتاح في الموقع (${issue.available}).`;
}

/** Max quantity a line can take without exceeding location on-hand (shared bucket). */
export function maxQuantityForLine(params: {
  lines: WarehouseOperationLine[];
  lineId: string;
  availableAtLocation: number;
  fromLocationId?: string;
}): number {
  const target = params.lines.find((line) => line.id === params.lineId);
  if (!target) return Math.max(0, params.availableAtLocation);

  const fromId = target.fromLocationId ?? params.fromLocationId;
  if (!fromId || !target.productId) return Math.max(0, params.availableAtLocation);

  const usedByOthers = params.lines
    .filter(
      (line) =>
        line.id !== params.lineId &&
        (line.fromLocationId ?? params.fromLocationId) === fromId &&
        line.productId === target.productId &&
        (line.variantId ?? '') === (target.variantId ?? ''),
    )
    .reduce((sum, line) => sum + Math.max(0, line.quantity), 0);

  return Math.max(0, params.availableAtLocation - usedByOthers);
}

export async function readAvailableAtSourceLine(params: {
  companyId: string;
  kind: WarehouseOperationKind;
  line: WarehouseOperationLine;
  fromLocationId?: string;
}): Promise<number | null> {
  if (!needsSourceStockCheck(params.kind)) return null;
  if (!params.line.productId?.trim()) return null;
  const locationId = params.line.fromLocationId ?? params.fromLocationId;
  if (!locationId) return null;
  const qty = await inventoryStockService.getQuantityAtLocation(
    params.companyId,
    params.line.productId,
    locationId,
    params.line.variantId,
  );
  return Math.max(0, qty);
}
