import type { WarehouseOperation } from '@/features/inventory/domain/types/warehouse';

/** Demand/actual totals for list rows — prefers server aggregates over summing preview lines. */
export function operationListLineTotals(operation: WarehouseOperation): {
  demand: number;
  actual: number;
} {
  if (operation.totalDemandQuantity != null || operation.totalQuantity != null) {
    return {
      demand: operation.totalDemandQuantity ?? operation.totalQuantity ?? 0,
      actual: operation.totalQuantity ?? operation.totalDemandQuantity ?? 0,
    };
  }
  const demand = operation.lines.reduce(
    (sum, line) => sum + (line.demandQuantity ?? line.quantity),
    0,
  );
  const actual = operation.lines.reduce((sum, line) => sum + line.quantity, 0);
  return { demand, actual };
}

export function operationNeedsFullLinesFetch(operation: WarehouseOperation | null | undefined): boolean {
  if (!operation) return false;
  if (operation.linesPartial) return true;
  const count = operation.lineCount ?? operation.lines.length;
  return count > operation.lines.length;
}
