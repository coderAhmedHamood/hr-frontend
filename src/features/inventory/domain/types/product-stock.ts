import type { PaginationMeta } from '@/features/ecommerce/domain/types/common';

export type ProductStockDisplayLevel = 'product' | 'variant';

export type ProductStockLocationRow = {
  locationId: string;
  warehouseId: string;
  locationCode: string;
  locationNameAr: string;
  warehouseCode: string;
  onHand: number;
};

export type ProductStockVariantRow = {
  variantId: string;
  sku: string;
  nameAr: string;
  onHand: number;
  reserved: number;
  available: number;
  quantityCache: number;
  isActive: boolean;
};

/** GET /inventory/products/:id/stock and GET /public/inventory/products/:productId/stock */
export type ProductStockSnapshot = {
  productId: string;
  companyId: string;
  trackInventory: boolean;
  warehouseId: string | null;
  locationId: string | null;
  onHand: number;
  reserved: number;
  available: number;
  productLevelOnHand: number;
  quantityCache: number;
  displayLevel: ProductStockDisplayLevel;
  locations: ProductStockLocationRow[];
  variants: ProductStockVariantRow[];
};

export type InventoryStockListQuery = {
  companyId: string;
  warehouseId?: string;
  locationId?: string;
  productId?: string;
  variantId?: string;
  sku?: string;
  barcode?: string;
  search?: string;
  posAvailable?: boolean;
  inStockOnly?: boolean;
  page?: number;
  limit?: number;
};

/** GET /inventory/stock — fast POS / quantity list */
export type InventoryStockListItem = {
  productId: string;
  variantId: string | null;
  sku: string;
  nameAr: string;
  nameEn: string | null;
  barcode: string | null;
  trackInventory: boolean;
  posAvailable: boolean;
  allowBackorder: boolean;
  warehouseId: string | null;
  locationId: string | null;
  onHand: number;
  quantityCache: number;
};

export type InventoryStockListResult = {
  items: InventoryStockListItem[];
  pagination: PaginationMeta;
};
