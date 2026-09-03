import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { toNumber } from '@/features/inventory/lib/api/numbers';
import type {
  InventoryLedgerEntry,
  InventoryLedgerListQuery,
  InventoryLedgerSummary,
} from '@/features/inventory/domain/types/inventory-ledger';

type LedgerDto = Omit<InventoryLedgerEntry, 'quantityDelta'> & {
  quantityDelta: string | number;
};

type LedgerListDto = PaginatedResult<LedgerDto> & {
  summary?: {
    entries: number | string;
    qtyIn: number | string;
    qtyOut: number | string;
    net: number | string;
  };
};

function mapEntry(dto: LedgerDto): InventoryLedgerEntry {
  return {
    id: dto.id,
    companyId: dto.companyId,
    occurredAt: dto.occurredAt,
    operationId: dto.operationId,
    operationLineId: dto.operationLineId,
    operationReference: dto.operationReference,
    kind: dto.kind,
    productId: dto.productId,
    productName: dto.productName,
    variantId: dto.variantId ?? undefined,
    sku: dto.sku ?? undefined,
    warehouseId: dto.warehouseId,
    locationId: dto.locationId,
    quantityDelta: toNumber(dto.quantityDelta),
    counterpartLocationId: dto.counterpartLocationId ?? undefined,
    counterpartWarehouseId: dto.counterpartWarehouseId ?? undefined,
    sourceDocument: dto.sourceDocument ?? undefined,
    partnerName: dto.partnerName ?? undefined,
    notes: dto.notes ?? undefined,
    createdAt: dto.createdAt,
  };
}

export const inventoryLedgerApi = {
  async list(query: InventoryLedgerListQuery) {
    if (!query.companyId?.trim()) {
      throw new Error('companyId مطلوب لقائمة قيود المخزون.');
    }
    const result = await apiRequest<LedgerListDto>('/inventory/ledger-entries', {
      query: {
        companyId: query.companyId,
        warehouseId: query.warehouseId,
        productId: query.productId,
        locationId: query.locationId,
        kind: query.kind,
        operationId: query.operationId,
        occurredAtFrom: query.occurredAtFrom,
        occurredAtTo: query.occurredAtTo,
        search: query.search,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
      },
    });
    const summary: InventoryLedgerSummary = {
      entries: toNumber(result.summary?.entries, result.pagination?.total ?? 0),
      qtyIn: toNumber(result.summary?.qtyIn),
      qtyOut: toNumber(result.summary?.qtyOut),
      net: toNumber(result.summary?.net),
    };
    return {
      items: (result.items ?? []).map(mapEntry),
      pagination: result.pagination,
      summary,
    };
  },

  async append(entries: Omit<InventoryLedgerEntry, 'id' | 'createdAt'>[]): Promise<InventoryLedgerEntry[]> {
    const created: InventoryLedgerEntry[] = [];
    for (const entry of entries) {
      const dto = await apiRequest<LedgerDto>('/inventory/ledger-entries', {
        method: 'POST',
        body: {
          companyId: entry.companyId,
          operationId: entry.operationId,
          operationLineId: entry.operationLineId,
          locationId: entry.locationId,
          quantityDelta: entry.quantityDelta,
          occurredAt: entry.occurredAt,
          operationReference: entry.operationReference,
          kind: entry.kind,
          productId: entry.productId,
          productName: entry.productName,
          variantId: entry.variantId ?? null,
          sku: entry.sku ?? null,
          warehouseId: entry.warehouseId,
          counterpartLocationId: entry.counterpartLocationId ?? null,
          counterpartWarehouseId: entry.counterpartWarehouseId ?? null,
          sourceDocument: entry.sourceDocument ?? null,
          partnerName: entry.partnerName ?? null,
          notes: entry.notes ?? null,
        },
      });
      created.push(mapEntry(dto));
    }
    return created;
  },

  async listByOperation(companyId: string, operationId: string): Promise<InventoryLedgerEntry[]> {
    const page = await this.list({ companyId, operationId, page: 1, limit: 500 });
    return page.items;
  },
};
