import { apiRequest } from '@/features/hr/lib/api/client';
import { toNumber } from '@/features/inventory/lib/api/numbers';

export type StockBalanceGroupBy = 'location' | 'warehouse' | 'product' | 'total';

export type StockBalanceQuery = {
  companyId: string;
  productId?: string;
  productIds?: string[];
  variantId?: string;
  variantIds?: string[];
  productLevelOnly?: boolean;
  warehouseId?: string;
  warehouseIds?: string[];
  locationId?: string;
  locationIds?: string[];
  groupBy?: StockBalanceGroupBy;
  includeZero?: boolean;
};

export type StockBalanceRow = {
  productId: string | null;
  variantId: string | null;
  warehouseId: string | null;
  warehouseCode: string | null;
  warehouseNameAr: string | null;
  locationId: string | null;
  locationCode: string | null;
  locationNameAr: string | null;
  onHand: number;
  reserved: number;
  available: number;
};

export type StockBalanceResult = {
  companyId: string;
  groupBy: StockBalanceGroupBy;
  totalOnHand: number;
  rows: StockBalanceRow[];
};

type StockBalanceRowDto = {
  productId: string | null;
  variantId: string | null;
  warehouseId: string | null;
  warehouseCode: string | null;
  warehouseNameAr: string | null;
  locationId: string | null;
  locationCode: string | null;
  locationNameAr: string | null;
  onHand: string | number;
  reserved: string | number;
  available: string | number;
};

type StockBalanceResponseDto = {
  companyId: string;
  groupBy: StockBalanceGroupBy;
  totalOnHand: string | number;
  rows: StockBalanceRowDto[];
};

function joinIds(ids?: string[]): string | undefined {
  if (!ids?.length) return undefined;
  return ids.join(',');
}

function mapRow(dto: StockBalanceRowDto): StockBalanceRow {
  return {
    productId: dto.productId,
    variantId: dto.variantId,
    warehouseId: dto.warehouseId,
    warehouseCode: dto.warehouseCode,
    warehouseNameAr: dto.warehouseNameAr,
    locationId: dto.locationId,
    locationCode: dto.locationCode,
    locationNameAr: dto.locationNameAr,
    onHand: toNumber(dto.onHand),
    reserved: toNumber(dto.reserved),
    available: toNumber(dto.available),
  };
}

export const inventoryStockBalancesApi = {
  async query(query: StockBalanceQuery): Promise<StockBalanceResult> {
    if (!query.companyId?.trim()) {
      throw new Error('companyId مطلوب لاستعلام رصيد المخزون.');
    }

    const dto = await apiRequest<StockBalanceResponseDto>('/inventory/stock/balances', {
      query: {
        companyId: query.companyId,
        productId: query.productId,
        productIds: joinIds(query.productIds),
        variantId: query.variantId,
        variantIds: joinIds(query.variantIds),
        productLevelOnly: query.productLevelOnly,
        warehouseId: query.warehouseId,
        warehouseIds: joinIds(query.warehouseIds),
        locationId: query.locationId,
        locationIds: joinIds(query.locationIds),
        groupBy: query.groupBy ?? 'location',
        includeZero: query.includeZero,
      },
    });

    return {
      companyId: dto.companyId,
      groupBy: dto.groupBy,
      totalOnHand: toNumber(dto.totalOnHand),
      rows: (dto.rows ?? []).map(mapRow),
    };
  },
};
