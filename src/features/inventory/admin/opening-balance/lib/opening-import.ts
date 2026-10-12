import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { ApiError } from '@/shared/api/client';
import { findDefaultInternalStockLocationId } from '@/features/inventory/admin/operations/lib/operation-location-filters';
import type { WarehouseLocation } from '@/features/inventory/domain/types/warehouse';
import type { OpeningSheetIssue, OpeningSheetRow } from './opening-sheet';

export type OpeningProductRow = { id: string; nameAr: string; sku: string; barcode?: string | null };
export type OpeningVariantRow = {
  id: string;
  productId: string;
  nameAr: string;
  sku: string;
  barcode: string | null;
};

/** A sheet line resolved to an item and a location, or to a product still to create. */
export type OpeningPlanLine = {
  key: string;
  rowNumbers: number[];
  productId: string | null;
  variantId: string | null;
  /** Groups the lines of one product still to create. */
  newProductKey: string | null;
  sku: string;
  nameAr: string;
  barcode: string;
  salePrice: number | null;
  locationId: string;
  quantity: number;
  unitCost: number | null;
};

export type OpeningPlan = {
  lines: OpeningPlanLine[];
  issues: OpeningSheetIssue[];
  existingCount: number;
  newProductCount: number;
};

const norm = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();
const round4 = (value: number) => Math.round(value * 10_000) / 10_000;

function groupBy<T>(items: T[], keyOf: (item: T) => string | null | undefined) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = norm(keyOf(item));
    if (!key) continue;
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

type Candidate =
  | { kind: 'product'; product: OpeningProductRow }
  | { kind: 'variant'; variant: OpeningVariantRow };

const candidateName = (c: Candidate) => (c.kind === 'product' ? c.product.nameAr : c.variant.nameAr);

/**
 * Matches each row by code, then barcode, then exact name (rows without a
 * code), and merges rows for the same item and location. Two items sharing
 * the code, barcode or name are reported, never picked silently. Nothing is
 * written.
 */
export function buildOpeningPlan(input: {
  rows: OpeningSheetRow[];
  locations: WarehouseLocation[];
  products: OpeningProductRow[];
  variants: OpeningVariantRow[];
  archivedProducts?: OpeningProductRow[];
}): OpeningPlan {
  const productsBySku = groupBy(input.products, (p) => p.sku);
  const productsByBarcode = groupBy(input.products, (p) => p.barcode);
  const productsByName = groupBy(input.products, (p) => p.nameAr);
  const variantsBySku = groupBy(input.variants, (v) => v.sku);
  const variantsByBarcode = groupBy(input.variants, (v) => v.barcode);
  const archivedBySku = groupBy(input.archivedProducts ?? [], (p) => p.sku);

  const stockLocations = input.locations.filter(
    (loc) => loc.isActive !== false && loc.locationType === 'internal',
  );
  const defaultLocationId = findDefaultInternalStockLocationId(stockLocations);
  const locationByLabel = new Map<string, string>();
  for (const loc of stockLocations) {
    if (loc.code) locationByLabel.set(norm(loc.code), loc.id);
    if (loc.nameAr) locationByLabel.set(norm(loc.nameAr), loc.id);
  }

  const issues: OpeningSheetIssue[] = [];
  const merged = new Map<string, OpeningPlanLine & { costedQty: number; costTotal: number }>();

  const candidatesFor = (
    variants: OpeningVariantRow[] | undefined,
    products: OpeningProductRow[] | undefined,
  ): Candidate[] => [
    ...(variants ?? []).map((variant) => ({ kind: 'variant' as const, variant })),
    ...(products ?? []).map((product) => ({ kind: 'product' as const, product })),
  ];

  for (const row of input.rows) {
    const locationId = row.location ? locationByLabel.get(norm(row.location)) : defaultLocationId;
    if (!locationId) {
      issues.push({
        rowNumber: row.rowNumber,
        message: row.location
          ? `الموقع «${row.location}» غير موجود في هذا المستودع.`
          : 'لا يوجد موقع تخزين داخلي في هذا المستودع.',
      });
      continue;
    }

    let match: Candidate | null = null;
    let problem: string | null = null;
    const attempts: Array<[string, string, Candidate[]]> = [];
    if (row.sku) {
      attempts.push([
        'الرمز',
        row.sku,
        candidatesFor(variantsBySku.get(norm(row.sku)), productsBySku.get(norm(row.sku))),
      ]);
    }
    if (row.barcode) {
      attempts.push([
        'الباركود',
        row.barcode,
        candidatesFor(
          variantsByBarcode.get(norm(row.barcode)),
          productsByBarcode.get(norm(row.barcode)),
        ),
      ]);
    }
    if (!row.sku && row.nameAr) {
      attempts.push(['الاسم', row.nameAr, candidatesFor([], productsByName.get(norm(row.nameAr)))]);
    }
    for (const [label, value, candidates] of attempts) {
      if (candidates.length > 1) {
        problem = `${label} «${value}» يطابق أكثر من صنف: ${candidates
          .slice(0, 3)
          .map((c) => `«${candidateName(c)}»`)
          .join(' و')}. اجعله فريداً أو استخدم رمز الصنف.`;
        break;
      }
      if (candidates.length === 1) {
        match = candidates[0]!;
        break;
      }
    }
    if (problem) {
      issues.push({ rowNumber: row.rowNumber, message: problem });
      continue;
    }

    if (!match && row.sku) {
      const archived = archivedBySku.get(norm(row.sku));
      if (archived?.length) {
        issues.push({
          rowNumber: row.rowNumber,
          message: `الرمز «${row.sku}» لصنف مؤرشف («${archived[0]!.nameAr}»). أعد تفعيله من الكتالوج أو غيّر الرمز.`,
        });
        continue;
      }
    }
    if (!match && !row.nameAr) {
      issues.push({
        rowNumber: row.rowNumber,
        message: `الصنف «${row.sku || row.barcode}» غير موجود؛ أضف اسم الصنف لإنشائه.`,
      });
      continue;
    }

    const productId =
      match?.kind === 'variant' ? match.variant.productId : match?.kind === 'product' ? match.product.id : null;
    const variantId = match?.kind === 'variant' ? match.variant.id : null;
    const newProductKey = productId
      ? null
      : JSON.stringify(['new', norm(row.sku) || norm(row.barcode) || norm(row.nameAr)]);
    const key = JSON.stringify([productId ?? newProductKey, variantId, locationId]);

    const existing = merged.get(key);
    if (existing) {
      existing.quantity += row.quantity;
      if (row.unitCost !== null) {
        existing.costedQty += row.quantity;
        existing.costTotal += row.unitCost * row.quantity;
      }
      existing.unitCost = existing.costedQty > 0 ? existing.costTotal / existing.costedQty : null;
      existing.rowNumbers.push(row.rowNumber);
      continue;
    }
    merged.set(key, {
      key,
      rowNumbers: [row.rowNumber],
      productId,
      variantId,
      newProductKey,
      sku:
        match?.kind === 'variant'
          ? match.variant.sku
          : match?.kind === 'product'
            ? match.product.sku
            : row.sku,
      nameAr: match ? candidateName(match) : row.nameAr,
      barcode: row.barcode,
      salePrice: row.salePrice,
      locationId,
      quantity: row.quantity,
      unitCost: row.unitCost,
      costedQty: row.unitCost !== null ? row.quantity : 0,
      costTotal: row.unitCost !== null ? row.unitCost * row.quantity : 0,
    });
  }

  const lines: OpeningPlanLine[] = [...merged.values()].map(
    ({ costedQty: _q, costTotal: _t, ...line }) => line,
  );
  return {
    lines,
    issues,
    existingCount: lines.filter((l) => l.productId).length,
    newProductCount: new Set(lines.map((l) => l.newProductKey).filter(Boolean)).size,
  };
}

async function fetchAll<T>(
  path: string,
  companyId: string,
  archiveScope: 'active' | 'archived' = 'active',
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const result = await apiRequest<PaginatedResult<T>>(path, {
      query: { companyId, page, limit: 500, archiveScope },
      throwOnError: true,
    });
    items.push(...(result.items ?? []));
    if (page >= (result.pagination?.totalPages ?? 1)) return items;
  }
}

export async function planOpeningImport(input: {
  companyId: string;
  rows: OpeningSheetRow[];
  locations: WarehouseLocation[];
}): Promise<OpeningPlan> {
  const [products, variants, archivedProducts] = await Promise.all([
    fetchAll<OpeningProductRow>('/inventory/products', input.companyId),
    fetchAll<OpeningVariantRow>('/inventory/product-variants', input.companyId),
    fetchAll<OpeningProductRow>('/inventory/products', input.companyId, 'archived'),
  ]);
  return buildOpeningPlan({ ...input, products, variants, archivedProducts });
}

/** The warehouse already has an opening document; the user must confirm. */
export class OpeningExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpeningExistsError';
  }
}

/** The request body for `POST /inventory/opening-imports`. */
export function buildOpeningImportRequest(input: {
  companyId: string;
  warehouseId: string;
  plan: OpeningPlan;
  sourceDocument: string;
  confirmDuplicate?: boolean;
}) {
  const newProducts = new Map<string, Record<string, unknown>>();
  for (const line of input.plan.lines) {
    if (!line.newProductKey || newProducts.has(line.newProductKey)) continue;
    newProducts.set(line.newProductKey, {
      key: line.newProductKey,
      nameAr: line.nameAr,
      sku: line.sku || undefined,
      barcode: line.barcode || null,
      priceAmount: line.salePrice !== null ? round4(line.salePrice) : 0,
      costPriceAmount: line.unitCost !== null ? round4(line.unitCost) : null,
    });
  }
  return {
    companyId: input.companyId,
    warehouseId: input.warehouseId,
    sourceDocument: input.sourceDocument.slice(0, 255),
    confirmDuplicate: input.confirmDuplicate === true,
    newProducts: [...newProducts.values()],
    lines: input.plan.lines.map((line) => ({
      productId: line.productId ?? undefined,
      newProductKey: line.newProductKey ?? undefined,
      variantId: line.variantId,
      toLocationId: line.locationId,
      quantity: round4(line.quantity),
      unitCost: line.unitCost !== null ? line.unitCost.toFixed(8) : null,
    })),
  };
}

/**
 * Sends the whole sheet in one request: the server creates the missing
 * products (as drafts), the draft opening document and its lines in one
 * transaction, so a failure leaves nothing behind and a retry starts clean.
 */
export async function runOpeningImport(input: {
  companyId: string;
  warehouseId: string;
  plan: OpeningPlan;
  sourceDocument: string;
  confirmDuplicate?: boolean;
}): Promise<{ operationId: string; reference: string; createdProducts: number }> {
  try {
    return await apiRequest<{ operationId: string; reference: string; createdProducts: number }>(
      '/inventory/opening-imports',
      {
        method: 'POST',
        throwOnError: true,
        silent: true,
        body: buildOpeningImportRequest(input),
      },
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.payload as { code?: string } | null)?.code === 'INVENTORY_OPENING_EXISTS'
    ) {
      throw new OpeningExistsError(error.message);
    }
    if (error instanceof ApiError) throw new Error(error.message);
    throw error;
  }
}
