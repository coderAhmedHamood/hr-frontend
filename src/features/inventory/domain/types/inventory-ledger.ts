import type { TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';

/**
 * Immutable inventory ledger entry.
 * One row = one quantity change at one location (signed delta).
 * Source of historical truth for reports; LocationStock remains the live balance cache.
 */
export type InventoryLedgerEntry = TenantScoped & {
  id: string;
  occurredAt: string;
  operationId: string;
  operationLineId: string;
  operationReference: string;
  kind: WarehouseOperationKind;
  productId: string;
  productName: string;
  variantId?: string;
  sku?: string;
  warehouseId: string;
  /** Location whose on-hand changed */
  locationId: string;
  /** Signed delta applied to LocationStock (+ in / − out) */
  quantityDelta: number;
  /** Optional counterpart for moves/transfers */
  counterpartLocationId?: string;
  counterpartWarehouseId?: string;
  sourceDocument?: string;
  partnerName?: string;
  notes?: string;
  createdAt: string;
};

export type InventoryLedgerListQuery = {
  companyId: string;
  warehouseId?: string;
  productId?: string;
  locationId?: string;
  kind?: WarehouseOperationKind;
  operationId?: string;
  search?: string;
  page?: number;
  limit?: number;
};
