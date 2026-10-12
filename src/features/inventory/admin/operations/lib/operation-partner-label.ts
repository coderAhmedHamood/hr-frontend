import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';

/** Label of the document's partner field, by kind (returns name the customer / supplier). */
export function operationPartnerLabel(kind: WarehouseOperationKind): string {
  if (kind === 'issue') return 'الصرف إلى';
  if (kind === 'supplier_return') return 'الإرجاع إلى المورد';
  if (kind === 'customer_return') return 'العميل المُرجِع';
  if (WAREHOUSE_OPERATION_KIND_META[kind]?.stockEffect === 'inbound') return 'الاستلام من';
  return 'الطرف';
}

/** Which side the outside partner is on: goods come from it, or go to it. */
export function operationPartnerSide(
  kind: WarehouseOperationKind,
): { side: 'from' | 'to'; partner: 'customers' | 'vendors' } | null {
  if (kind === 'customer_return') return { side: 'from', partner: 'customers' };
  if (kind === 'supplier_return') return { side: 'to', partner: 'vendors' };
  const effect = WAREHOUSE_OPERATION_KIND_META[kind]?.stockEffect;
  if (effect === 'inbound') return { side: 'from', partner: 'vendors' };
  if (effect === 'outbound') return { side: 'to', partner: 'customers' };
  return null;
}
