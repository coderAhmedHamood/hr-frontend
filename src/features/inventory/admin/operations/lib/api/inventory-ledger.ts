import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { ListGroupsResult } from '@/components/ui/list-group';
import { toNumber } from '@/features/inventory/lib/api/numbers';
import type {
  InboundProductValueSummary,
  InventoryLedgerEntry,
  InventoryLedgerListQuery,
  InventoryLedgerSummary,
} from '@/features/inventory/domain/types/inventory-ledger';

type LedgerDto = Omit<InventoryLedgerEntry, 'quantityDelta' | 'unitCost'> & {
  quantityDelta: string | number;
  unitCost?: string | number | null;
};

type LedgerListDto = PaginatedResult<LedgerDto> & {
  summary?: {
    entries: number | string;
    qtyIn: number | string;
    qtyOut: number | string;
    net: number | string;
  };
  productSummary?: Array<{
    productId: string;
    variantId?: string | null;
    productName: string;
    sku?: string | null;
    entries: number | string;
    quantity: number | string;
    averageUnitCost?: number | string | null;
    totalValue: number | string;
  }>;
};

function mapEntry(dto: LedgerDto): InventoryLedgerEntry {
  return {
    id: dto.id,
    ...(dto.groupKey !== undefined ? { groupKey: dto.groupKey } : {}),
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
    unitCost:
      dto.unitCost != null && dto.unitCost !== '' ? toNumber(dto.unitCost) : null,
    costCurrency: dto.costCurrency ?? null,
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
        flow: query.flow,
        operationId: query.operationId,
        occurredAtFrom: query.occurredAtFrom,
        occurredAtTo: query.occurredAtTo,
        search: query.search,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
        groupBy: query.groupBy,
        groupValue: query.groupValue,
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
      productSummary: (result.productSummary ?? []).map(
        (row): InboundProductValueSummary => ({
          productId: row.productId,
          variantId: row.variantId ?? null,
          productName: row.productName,
          sku: row.sku ?? null,
          entries: toNumber(row.entries),
          quantity: toNumber(row.quantity),
          averageUnitCost:
            row.averageUnitCost != null && row.averageUnitCost !== ''
              ? toNumber(row.averageUnitCost)
              : null,
          totalValue: toNumber(row.totalValue),
        }),
      ),
    };
  },

  /** Movement counts and quantities in / out / net per group, and overall. */
  groups(query: InventoryLedgerListQuery): Promise<ListGroupsResult> {
    return apiRequest<ListGroupsResult>('/inventory/ledger-entries/groups', {
      throwOnError: true,
      query: {
        companyId: query.companyId,
        warehouseId: query.warehouseId,
        productId: query.productId,
        locationId: query.locationId,
        kind: query.kind,
        flow: query.flow,
        occurredAtFrom: query.occurredAtFrom,
        occurredAtTo: query.occurredAtTo,
        search: query.search,
        groupBy: query.groupBy,
      },
    });
  },

  async listByOperation(companyId: string, operationId: string): Promise<InventoryLedgerEntry[]> {
    const entries: InventoryLedgerEntry[] = [];
    for (let page = 1; ; page += 1) {
      const result = await this.list({ companyId, operationId, page, limit: 500 });
      entries.push(...result.items);
      if (page >= (result.pagination?.totalPages ?? 1)) return entries;
    }
  },
};
