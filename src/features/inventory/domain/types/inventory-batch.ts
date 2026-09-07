import type { TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';

/**
 * دفعة مخزون — a stock layer created when quantity entered a location.
 * Layers are written only by operation posting and consumed in the company's
 * FIFO/LIFO/FEFO order, so they are read-only here and exist for traceability.
 */
export type InventoryBatch = TenantScoped & {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  locationId: string;
  locationCode: string;
  locationName: string;
  /** When the layer entered stock — drives FIFO/LIFO order. */
  occurredAt: string;
  /** Drives FEFO order; layers without expiry are consumed last. */
  expiryDate?: string;
  quantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  sourceOperationId?: string;
  sourceOperationReference?: string;
  sourceOperationKind?: WarehouseOperationKind;
  /** Parent layer when this one came from a transfer. */
  sourceBatchId?: string;
  /** Came from the opening-balance migration rather than an operation. */
  isOpening: boolean;
  isAvailable: boolean;
  createdAt: string;
};

export type InventoryBatchSummary = {
  batches: number;
  quantity: number;
  remaining: number;
  consumed: number;
  availableBatches: number;
  expiredBatches: number;
};

/** `available` (default) keeps consumable layers; `depleted` shows spent history. */
export type InventoryBatchAvailability = 'available' | 'depleted' | 'all';

export type InventoryBatchSort = 'newest' | 'oldest' | 'expiry' | 'remaining';

export type InventoryBatchListQuery = {
  companyId: string;
  productId?: string;
  variantId?: string;
  warehouseId?: string;
  locationId?: string;
  sourceOperationId?: string;
  availability?: InventoryBatchAvailability;
  hasExpiry?: boolean;
  expiryBefore?: string;
  expiryAfter?: string;
  occurredAtFrom?: string;
  occurredAtTo?: string;
  search?: string;
  sort?: InventoryBatchSort;
  page?: number;
  limit?: number;
};
