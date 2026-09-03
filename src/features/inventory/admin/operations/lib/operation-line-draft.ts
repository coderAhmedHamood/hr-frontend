import type { WarehouseOperationKind, WarehouseOperationLine } from '@/features/inventory/domain/types/warehouse';

export type OperationLineDraft = {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
};

export function supportsMultiProductLines(kind: WarehouseOperationKind): boolean {
  return (
    kind === 'transfer' ||
    kind === 'receipt' ||
    kind === 'issue' ||
    kind === 'internal' ||
    kind === 'purchase' ||
    kind === 'replenishment'
  );
}

/** Outbound pickers: only products with on-hand at the source location. */
export function pickerUsesSourceLocationStock(kind: WarehouseOperationKind): boolean {
  return kind === 'transfer' || kind === 'internal' || kind === 'issue' || kind === 'scrap';
}

export function newOperationLineDraftId(): string {
  return `opl-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyOperationLineDraft(): OperationLineDraft {
  return {
    id: newOperationLineDraftId(),
    productId: '',
    productName: '',
    sku: '',
    quantity: 0,
  };
}

export function operationLineDraftKey(line: Pick<OperationLineDraft, 'productId'>): string {
  return line.productId.trim();
}

export function hasDuplicateOperationLineProducts(lines: OperationLineDraft[]): boolean {
  const keys = lines
    .filter((line) => line.productId.trim())
    .map((line) => operationLineDraftKey(line));
  return new Set(keys).size !== keys.length;
}

export function operationLineDraftsToLines(
  drafts: OperationLineDraft[],
  locations: { fromLocationId?: string; toLocationId?: string },
): WarehouseOperationLine[] {
  return drafts
    .filter((line) => line.productId.trim() && line.quantity > 0)
    .map((line) => ({
      id: line.id,
      productId: line.productId.trim(),
      productName: line.productName.trim() || 'منتج',
      sku: line.sku?.trim() || undefined,
      demandQuantity: line.quantity,
      quantity: line.quantity,
      fromLocationId: locations.fromLocationId,
      toLocationId: locations.toLocationId,
    }));
}

export function operationLinesToDrafts(lines: WarehouseOperationLine[]): OperationLineDraft[] {
  if (lines.length === 0) return [emptyOperationLineDraft()];
  return lines.map((line) => ({
    id: line.id,
    productId: line.productId,
    productName: line.productName,
    sku: line.sku,
    quantity: line.quantity,
  }));
}
