import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type {
  WarehouseLocation,
  WarehouseOperation,
  WarehouseOperationKind,
  WarehouseOperationStatus,
} from '@/features/inventory/domain/types/warehouse';

export type StockMoveLedgerRow = {
  key: string;
  operationId: string;
  operation: WarehouseOperation;
  occurredAt: string;
  reference: string;
  kind: WarehouseOperationKind;
  status: WarehouseOperationStatus;
  warehouseId: string;
  destinationWarehouseId?: string;
  partnerName?: string;
  sourceDocument?: string;
  productName: string;
  sku?: string;
  productId?: string;
  fromLabel: string;
  toLabel: string;
  demandQuantity: number;
  quantity: number;
  signedQuantity: number;
};

function defaultPartnerLabels(
  kind: WarehouseOperationKind,
  locations: WarehouseLocation[],
  warehouseId: string,
): { from?: string; to?: string } {
  const inWarehouse = locations.filter((location) => location.warehouseId === warehouseId);
  const vendors =
    inWarehouse.find((location) => location.locationType === 'supplier')?.nameAr ?? 'الموردون';
  const customers =
    inWarehouse.find((location) => location.locationType === 'customer')?.nameAr ?? 'العملاء';
  const effect = WAREHOUSE_OPERATION_KIND_META[kind]?.stockEffect;
  if (effect === 'inbound') return { from: vendors };
  if (effect === 'outbound') return { to: customers };
  return {};
}

function signedQty(kind: WarehouseOperationKind, qty: number): number {
  const effect = WAREHOUSE_OPERATION_KIND_META[kind]?.stockEffect;
  if (effect === 'outbound') return -Math.abs(qty);
  if (effect === 'inbound' || effect === 'adjust_set') return Math.abs(qty);
  return qty;
}

export function flattenOperationsToMoveRows(
  operations: WarehouseOperation[],
  locations: WarehouseLocation[],
  locationName: (id?: string) => string,
): StockMoveLedgerRow[] {
  const rows: StockMoveLedgerRow[] = [];
  for (const op of operations) {
    const defaults = defaultPartnerLabels(op.kind, locations, op.warehouseId);
    for (const line of op.lines) {
      const qty = op.status === 'done' ? line.quantity : (line.demandQuantity ?? line.quantity);
      rows.push({
        key: `${op.id}-${line.id}`,
        operationId: op.id,
        operation: op,
        occurredAt: op.occurredAt,
        reference: op.reference,
        kind: op.kind,
        status: op.status,
        warehouseId: op.warehouseId,
        destinationWarehouseId: op.destinationWarehouseId,
        partnerName: op.partnerName,
        sourceDocument: op.sourceDocument,
        productName: line.productName,
        sku: line.sku,
        productId: line.productId,
        fromLabel: locationName(line.fromLocationId) || defaults.from || '—',
        toLabel: locationName(line.toLocationId) || defaults.to || '—',
        demandQuantity: line.demandQuantity ?? line.quantity,
        quantity: qty,
        signedQuantity: signedQty(op.kind, qty),
      });
    }
  }
  return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export type MovesAnalysisRow = {
  key: string;
  kind: WarehouseOperationKind;
  warehouseId: string;
  operationCount: number;
  lineCount: number;
  qtyIn: number;
  qtyOut: number;
  netQty: number;
};

export function aggregateMovesByKindAndWarehouse(rows: StockMoveLedgerRow[]): MovesAnalysisRow[] {
  const map = new Map<string, MovesAnalysisRow>();
  const seenOps = new Map<string, Set<string>>();

  for (const row of rows) {
    if (row.status !== 'done') continue;
    const key = `${row.kind}::${row.warehouseId}`;
    let agg = map.get(key);
    if (!agg) {
      agg = {
        key,
        kind: row.kind,
        warehouseId: row.warehouseId,
        operationCount: 0,
        lineCount: 0,
        qtyIn: 0,
        qtyOut: 0,
        netQty: 0,
      };
      map.set(key, agg);
      seenOps.set(key, new Set());
    }
    const ops = seenOps.get(key)!;
    if (!ops.has(row.operationId)) {
      ops.add(row.operationId);
      agg.operationCount += 1;
    }
    agg.lineCount += 1;
    if (row.signedQuantity >= 0) agg.qtyIn += row.signedQuantity;
    else agg.qtyOut += Math.abs(row.signedQuantity);
    agg.netQty += row.signedQuantity;
  }

  return Array.from(map.values()).sort((a, b) => {
    const kindCmp = a.kind.localeCompare(b.kind);
    return kindCmp !== 0 ? kindCmp : a.warehouseId.localeCompare(b.warehouseId);
  });
}
