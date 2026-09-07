import type { WarehouseOperationKind, WarehouseOperationLine } from '@/features/inventory/domain/types/warehouse';

export type OperationLineDraft = {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  /** تكلفة الوحدة عند الإدخال — فقط للأنواع الواردة (انظر lineNeedsUnitCost). */
  unitCost?: string;
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

/**
 * تكلفة الوحدة تُطلب فقط للعمليات الواردة (شراء/استلام/تجديد) — الـbackend
 * يتجاهلها في التحويل والصادر (التكلفة تُشتق من الدفعة المصدر أو محرك
 * التكلفة، وليس من إدخال العميل). استخدم stockEffect بدل مطابقة kind مباشرة
 * كي يبقى هذا متسقًا مع WAREHOUSE_OPERATION_KIND_META.
 */
export function lineNeedsUnitCost(stockEffect: 'inbound' | 'outbound' | 'move' | 'transfer' | 'adjust_set'): boolean {
  return stockEffect === 'inbound';
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
    unitCost: '',
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
  options?: { includeUnitCost?: boolean },
): WarehouseOperationLine[] {
  const includeUnitCost = options?.includeUnitCost ?? false;
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
      // Never send unitCost for outbound/transfer/move kinds — the backend
      // ignores it there anyway, and this keeps the payload honest about
      // what the client actually controls (cost is derived, not client-set).
      unitCost: includeUnitCost ? line.unitCost?.trim() || undefined : undefined,
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
    unitCost: line.unitCost ?? '',
  }));
}
