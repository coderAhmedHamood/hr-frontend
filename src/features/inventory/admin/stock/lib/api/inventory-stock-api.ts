import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { toNumber } from '@/features/inventory/lib/api/numbers';
import type {
  InventoryStockListItem,
  InventoryStockListQuery,
  InventoryStockListResult,
  ProductStockSnapshot,
  ProductStockVariantRow,
} from '@/features/inventory/domain/types/product-stock';

type ProductStockLocationDto = {
  locationId: string;
  warehouseId: string;
  locationCode?: string | null;
  locationNameAr?: string | null;
  warehouseCode?: string | null;
  onHand: string | number;
};

type ProductStockVariantDto = {
  variantId: string;
  sku?: string | null;
  nameAr?: string | null;
  onHand?: string | number;
  reserved?: string | number;
  available?: string | number;
  quantityCache?: string | number;
  isActive?: boolean;
};

export type ProductStockDto = {
  productId: string;
  companyId: string;
  trackInventory: boolean;
  warehouseId?: string | null;
  locationId?: string | null;
  onHand?: string | number;
  reserved?: string | number;
  available?: string | number;
  productLevelOnHand?: string | number;
  quantityCache?: string | number;
  displayLevel?: 'product' | 'variant';
  locations?: ProductStockLocationDto[];
  variants?: ProductStockVariantDto[];
};

type InventoryStockListDto = {
  productId: string;
  variantId?: string | null;
  sku: string;
  nameAr: string;
  nameEn?: string | null;
  barcode?: string | null;
  trackInventory: boolean;
  posAvailable?: boolean;
  allowBackorder?: boolean;
  warehouseId?: string | null;
  locationId?: string | null;
  onHand: string | number;
  quantityCache: string | number;
};

function mapVariant(dto: ProductStockVariantDto): ProductStockVariantRow {
  return {
    variantId: dto.variantId,
    sku: dto.sku ?? '',
    nameAr: dto.nameAr ?? '',
    onHand: toNumber(dto.onHand),
    reserved: toNumber(dto.reserved),
    available: toNumber(dto.available),
    quantityCache: toNumber(dto.quantityCache),
    isActive: dto.isActive ?? true,
  };
}

export function mapProductStockDto(dto: ProductStockDto): ProductStockSnapshot {
  return {
    productId: dto.productId,
    companyId: dto.companyId,
    trackInventory: Boolean(dto.trackInventory),
    warehouseId: dto.warehouseId ?? null,
    locationId: dto.locationId ?? null,
    onHand: toNumber(dto.onHand),
    reserved: toNumber(dto.reserved),
    available: toNumber(dto.available),
    productLevelOnHand: toNumber(dto.productLevelOnHand),
    quantityCache: toNumber(dto.quantityCache),
    displayLevel: dto.displayLevel === 'variant' ? 'variant' : 'product',
    locations: (dto.locations ?? []).map((row) => ({
      locationId: row.locationId,
      warehouseId: row.warehouseId,
      locationCode: row.locationCode ?? '',
      locationNameAr: row.locationNameAr ?? '',
      warehouseCode: row.warehouseCode ?? '',
      onHand: toNumber(row.onHand),
    })),
    variants: (dto.variants ?? []).map(mapVariant),
  };
}

function mapListItem(dto: InventoryStockListDto): InventoryStockListItem {
  return {
    productId: dto.productId,
    variantId: dto.variantId ?? null,
    sku: dto.sku,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? null,
    barcode: dto.barcode ?? null,
    trackInventory: Boolean(dto.trackInventory),
    posAvailable: Boolean(dto.posAvailable),
    allowBackorder: Boolean(dto.allowBackorder),
    warehouseId: dto.warehouseId ?? null,
    locationId: dto.locationId ?? null,
    onHand: toNumber(dto.onHand),
    quantityCache: toNumber(dto.quantityCache),
  };
}

/**
 * Fast stock list + per-product stock snapshot.
 * GET /inventory/stock · GET /inventory/products/:id/stock
 */
export const inventoryStockApi = {
  async list(query: InventoryStockListQuery): Promise<InventoryStockListResult> {
    const result = await apiRequest<PaginatedResult<InventoryStockListDto>>('/inventory/stock', {
      query: {
        companyId: query.companyId,
        warehouseId: query.warehouseId,
        locationId: query.locationId,
        productId: query.productId,
        variantId: query.variantId,
        sku: query.sku,
        barcode: query.barcode,
        search: query.search,
        posAvailable: query.posAvailable === true ? true : undefined,
        inStockOnly: query.inStockOnly === true ? true : undefined,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
      },
    });
    return {
      items: (result.items ?? []).map(mapListItem),
      pagination: result.pagination,
    };
  },

  async getProductStock(productId: string): Promise<ProductStockSnapshot | null> {
    try {
      const dto = await apiRequest<ProductStockDto>(
        `/inventory/products/${encodeURIComponent(productId)}/stock`,
      );
      return dto?.productId ? mapProductStockDto(dto) : null;
    } catch {
      return null;
    }
  },
};
