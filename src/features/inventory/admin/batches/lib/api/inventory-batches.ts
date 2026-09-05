import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { toNumber } from '@/features/inventory/lib/api/numbers';
import type {
  InventoryBatch,
  InventoryBatchListQuery,
  InventoryBatchSummary,
} from '@/features/inventory/domain/types/inventory-batch';

type BatchDto = Omit<
  InventoryBatch,
  'quantity' | 'remainingQuantity' | 'consumedQuantity'
> & {
  quantity: string | number;
  remainingQuantity: string | number;
  consumedQuantity: string | number;
};

type BatchListDto = PaginatedResult<BatchDto> & {
  summary?: {
    batches: number | string;
    quantity: number | string;
    remaining: number | string;
    consumed: number | string;
    availableBatches: number | string;
    expiredBatches: number | string;
  };
};

function mapBatch(dto: BatchDto): InventoryBatch {
  return {
    id: dto.id,
    companyId: dto.companyId,
    productId: dto.productId,
    productName: dto.productName,
    sku: dto.sku ?? undefined,
    variantId: dto.variantId ?? undefined,
    variantName: dto.variantName ?? undefined,
    variantSku: dto.variantSku ?? undefined,
    warehouseId: dto.warehouseId,
    warehouseCode: dto.warehouseCode,
    warehouseName: dto.warehouseName,
    locationId: dto.locationId,
    locationCode: dto.locationCode,
    locationName: dto.locationName,
    occurredAt: dto.occurredAt,
    expiryDate: dto.expiryDate ?? undefined,
    quantity: toNumber(dto.quantity),
    remainingQuantity: toNumber(dto.remainingQuantity),
    consumedQuantity: toNumber(dto.consumedQuantity),
    sourceOperationId: dto.sourceOperationId ?? undefined,
    sourceOperationReference: dto.sourceOperationReference ?? undefined,
    sourceOperationKind: dto.sourceOperationKind ?? undefined,
    sourceBatchId: dto.sourceBatchId ?? undefined,
    isOpening: Boolean(dto.isOpening),
    isAvailable: Boolean(dto.isAvailable),
    createdAt: dto.createdAt,
  };
}

export const inventoryBatchesApi = {
  async list(query: InventoryBatchListQuery) {
    if (!query.companyId?.trim()) {
      throw new Error('companyId مطلوب لقائمة دفعات المخزون.');
    }
    const result = await apiRequest<BatchListDto>('/inventory/batches', {
      query: {
        companyId: query.companyId,
        productId: query.productId,
        variantId: query.variantId,
        warehouseId: query.warehouseId,
        locationId: query.locationId,
        sourceOperationId: query.sourceOperationId,
        availability: query.availability,
        hasExpiry: query.hasExpiry,
        expiryBefore: query.expiryBefore,
        expiryAfter: query.expiryAfter,
        occurredAtFrom: query.occurredAtFrom,
        occurredAtTo: query.occurredAtTo,
        search: query.search,
        sort: query.sort,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
      },
    });
    const summary: InventoryBatchSummary = {
      batches: toNumber(result.summary?.batches, result.pagination?.total ?? 0),
      quantity: toNumber(result.summary?.quantity),
      remaining: toNumber(result.summary?.remaining),
      consumed: toNumber(result.summary?.consumed),
      availableBatches: toNumber(result.summary?.availableBatches),
      expiredBatches: toNumber(result.summary?.expiredBatches),
    };
    return {
      items: (result.items ?? []).map(mapBatch),
      pagination: result.pagination,
      summary,
    };
  },

  async getById(id: string): Promise<InventoryBatch | null> {
    try {
      const dto = await apiRequest<BatchDto>(`/inventory/batches/${id}`);
      return dto?.id ? mapBatch(dto) : null;
    } catch {
      return null;
    }
  },
};
