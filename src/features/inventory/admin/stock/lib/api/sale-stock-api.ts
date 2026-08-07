import { apiRequest } from '@/features/hr/lib/api/client';
import { inventoryLedgerApi } from '@/features/inventory/admin/operations/lib/api/inventory-ledger';
import { warehouseLocationsApi } from '@/features/inventory/admin/locations/lib/api/warehouse-locations';

export type SaleStockLineInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type SaleStockMutationInput = {
  companyId: string;
  locationId: string;
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
};

export type SaleStockDeductResult = {
  movement: 'sale_deduct';
  operationId: string | null;
  operationReference: string | null;
  locationId: string;
  warehouseId: string;
  lines: SaleStockLineResult[];
};

export type SaleStockRestoreResult = {
  movement: 'sale_restore';
  operationId: string | null;
  operationReference: string | null;
  locationId: string;
  warehouseId: string;
  lines: SaleStockLineResult[];
};

function toBody(input: SaleStockMutationInput) {
  return {
    companyId: input.companyId,
    locationId: input.locationId,
    sourceDocument: input.sourceDocument ?? null,
    partnerName: input.partnerName ?? null,
    notes: input.notes ?? null,
    createdBy: input.createdBy ?? null,
    lines: input.lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId ?? null,
      quantity: line.quantity,
    })),
  };
}

function logSaleStockResult(label: string, result: SaleStockDeductResult | SaleStockRestoreResult) {
  // Verification aid — inspect DevTools console after ship / cancel-refund.
  console.log(`[sale-stock] ${label}`, result);
  console.table?.(
    result.lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      status: line.status,
      onHandAfter: line.onHandAfter,
      ledgerEntryId: line.ledgerEntryId,
    })),
  );
}

/**
 * Default sale bin for company — WH/Stock, WH/STOCK, STOCK, or codes ending with /Stock (case-insensitive).
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
    };
    logSaleStockResult('sale-restore response', normalized);
    return normalized;
  },
};
