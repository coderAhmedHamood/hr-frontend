import type { TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { WarehouseLocationType } from '@/features/inventory/domain/types/warehouse';

/** On-hand quantity of a product (or variant) at a specific warehouse location. */
export type LocationStock = TenantScoped & {
  id: string;
  productId: string;
  /** When set, stock is tracked per sellable variant (aligns with storefront). */
  variantId?: string;
  warehouseId: string;
  locationId: string;
  productNameAr?: string;
  productSku?: string;
  variantNameAr?: string;
  variantSku?: string;
  warehouseNameAr?: string;
  warehouseCode?: string;
  locationNameAr?: string;
  locationCode?: string;
  locationType?: WarehouseLocationType;
  trackInventory?: boolean;
  lowStockThreshold?: number;
  unitCost?: number;
  costCurrency?: string;
  /** Physical on-hand at this location (source of truth for balances). */
  quantity: number;
  /**
   * Quantity reserved for open orders / allocations.
   * Available = quantity − reservedQuantity (never negative for display).
   */
  reservedQuantity: number;
  updatedAt: string;
};

/** Aggregated availability row for order fulfillment UI. */
export type StockAvailabilityRow = {
  warehouseId: string;
  warehouseNameAr: string;
  locationId: string;
  locationNameAr: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

export type LocationStockListQuery = {
  companyId: string;
  productId?: string;
  variantId?: string;
  warehouseId?: string;
  locationId?: string;
};
