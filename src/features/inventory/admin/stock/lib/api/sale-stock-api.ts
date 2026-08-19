import { apiRequest } from '@/features/hr/lib/api/client';
import { inventoryLedgerApi } from '@/features/inventory/admin/operations/lib/api/inventory-ledger';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';

export type SaleStockLineInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  /** Per-line bin — takes precedence over request-level locationId. */
  locationId?: string | null;
};

export type SaleStockMutationInput = {
  companyId: string;
  /** Optional unified bin for all lines that omit line.locationId. Backend falls back to the product warehouse. */
  locationId?: string | null;
  /** Optional unified warehouse (WH/Stock) when locationId is omitted. */
  warehouseId?: string | null;
  lines: SaleStockLineInput[];
  sourceDocument?: string | null;
  partnerName?: string | null;
  notes?: string | null;
  createdBy?: string | null;
};

/** @deprecated Prefer SaleStockLineInput */
export type SaleStockDeductLineInput = SaleStockLineInput;
/** @deprecated Prefer SaleStockMutationInput */
export type SaleStockDeductInput = SaleStockMutationInput;

export type SaleStockLineResult = {
  productId: string;
  variantId: string | null;
  quantity: string;
  status: 'deducted' | 'restored' | 'skipped_no_track';
  ledgerEntryId: string | null;
  onHandAfter: string | null;
  locationId: string | null;
  warehouseId: string | null;
  operationId: string | null;
};

export type SaleStockOperationResult = {
  operationId: string;
  operationReference: string;
  warehouseId: string;
};

export type SaleStockDeductResult = {
  movement: 'sale_deduct';
  operationId: string | null;
  operationReference: string | null;
  locationId: string | null;
  warehouseId: string | null;
  operations: SaleStockOperationResult[];
  lines: SaleStockLineResult[];
};

export type SaleStockRestoreResult = {
  movement: 'sale_restore';
  operationId: string | null;
  operationReference: string | null;
  locationId: string | null;
  warehouseId: string | null;
  operations: SaleStockOperationResult[];
  lines: SaleStockLineResult[];
};

function optionalUuid(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toBody(input: SaleStockMutationInput) {
  const locationId = optionalUuid(input.locationId);
  const warehouseId = optionalUuid(input.warehouseId);
  return {
    companyId: input.companyId,
    ...(locationId ? { locationId } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    sourceDocument: input.sourceDocument ?? null,
    partnerName: input.partnerName ?? null,
    notes: input.notes ?? null,
    createdBy: input.createdBy ?? null,
    lines: input.lines.map((line) => {
      const variantId = line.variantId?.trim() || null;
      const lineLocationId = optionalUuid(line.locationId);
      return {
        productId: line.productId,
        quantity: line.quantity,
        ...(variantId ? { variantId } : {}),
        ...(lineLocationId ? { locationId: lineLocationId } : {}),
      };
    }),
  };
}

function logSaleStockResult(label: string, result: SaleStockDeductResult | SaleStockRestoreResult) {
  console.log(`[sale-stock] ${label}`, result);
  console.table?.(
    result.lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      status: line.status,
      onHandAfter: line.onHandAfter,
      locationId: line.locationId,
      warehouseId: line.warehouseId,
      ledgerEntryId: line.ledgerEntryId,
    })),
  );
}

/**
 * Default sale bin for company — WH/Stock, WH/STOCK, STOCK, or codes ending with /Stock (case-insensitive).
 * Prefer omitting locationId so the backend uses the product warehouse.
 */
export async function resolveDefaultWhStockLocationId(companyId: string): Promise<string> {
  const page = await warehouseLocationsApi.getAll({ companyId, page: 1, limit: 500 });
  const active = page.items.filter((location) => location.isActive);
  const codeOf = (location: { code?: string | null }) => (location.code ?? '').trim();
  const preferred =
    active.find((location) => /^wh\/stock$/i.test(codeOf(location))) ??
    active.find((location) => /^stock$/i.test(codeOf(location))) ??
    active.find((location) => /\/stock$/i.test(codeOf(location))) ??
    active.find((location) => location.locationType === 'internal');
  if (!preferred?.id) {
    throw new Error('لا يوجد موقع مخزون افتراضي (WH/Stock أو STOCK) لهذه الشركة.');
  }
  return preferred.id;
}

/** Prefer the location that previously deducted this order (ledger), else default bin. */
export async function resolveSaleRestoreLocationId(
  companyId: string,
  orderNumber: string,
  productIds: string[],
): Promise<string> {
  for (const productId of productIds) {
    if (!productId) continue;
    const page = await inventoryLedgerApi.list({
      companyId,
      productId,
      search: orderNumber,
      page: 1,
      limit: 100,
    });
    const deduct = page.items.find(
      (entry) =>
        entry.sourceDocument === orderNumber &&
        entry.productId === productId &&
        entry.quantityDelta < 0 &&
        entry.locationId,
    );
    if (deduct?.locationId) return deduct.locationId;
  }
  return resolveDefaultWhStockLocationId(companyId);
}

/**
 * POST /inventory/stock/sale-deduct | sale-restore
 * Permission: inv.warehouse.ledger.create
 */
export const saleStockApi = {
  async deduct(input: SaleStockMutationInput): Promise<SaleStockDeductResult> {
    const result = await apiRequest<SaleStockDeductResult>('/inventory/stock/sale-deduct', {
      method: 'POST',
      throwOnError: true,
      body: toBody(input),
    });
    const normalized: SaleStockDeductResult = {
      ...result,
      movement: result.movement ?? 'sale_deduct',
      locationId: result.locationId ?? null,
      warehouseId: result.warehouseId ?? null,
      operations: result.operations ?? [],
      lines: (result.lines ?? []).map((line) => ({
        ...line,
        locationId: line.locationId ?? null,
        warehouseId: line.warehouseId ?? null,
        operationId: line.operationId ?? null,
      })),
    };
    logSaleStockResult('sale-deduct response', normalized);
    return normalized;
  },

  async restore(input: SaleStockMutationInput): Promise<SaleStockRestoreResult> {
    const result = await apiRequest<SaleStockRestoreResult>('/inventory/stock/sale-restore', {
      method: 'POST',
      throwOnError: true,
      body: toBody(input),
    });
    const normalized: SaleStockRestoreResult = {
      ...result,
      movement: result.movement ?? 'sale_restore',
      locationId: result.locationId ?? null,
      warehouseId: result.warehouseId ?? null,
      operations: result.operations ?? [],
      lines: (result.lines ?? []).map((line) => ({
        ...line,
        locationId: line.locationId ?? null,
        warehouseId: line.warehouseId ?? null,
        operationId: line.operationId ?? null,
      })),
    };
    logSaleStockResult('sale-restore response', normalized);
    return normalized;
  },
};
