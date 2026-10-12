import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { downloadXlsxFromAoA } from '@/shared/export/download-xlsx';

type LineRow = {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string | null;
  toLocationId: string | null;
  sortOrder?: number;
};
type LocationRow = { id: string; code: string | null; nameAr: string; locationType: string };
type SkuRow = { id: string; productId?: string; sku: string };

export type CountResultLine = {
  lineId?: string;
  productId?: string;
  variantId?: string | null;
  locationId?: string;
  countedQuantity: number;
};

export type CountSheetIssue = { rowNumber: number; message: string };

const HEADER = ['معرّف البند', 'الموقع', 'رمز الصنف', 'اسم الصنف', 'الكمية المعدودة'];
const COLUMNS = {
  lineId: ['معرّف البند', 'line id'],
  location: ['الموقع', 'location'],
  sku: ['رمز الصنف', 'sku', 'الرمز'],
  counted: ['الكمية المعدودة', 'الكمية', 'counted', 'quantity'],
} as const;
type ColumnKey = keyof typeof COLUMNS;

const norm = (value: unknown) =>
  String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();

async function fetchAll<T>(path: string, query: Record<string, string | undefined>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const result = await apiRequest<PaginatedResult<T>>(path, {
      query: { ...query, page, limit: 500, archiveScope: 'active' },
      throwOnError: true,
    });
    items.push(...(result.items ?? []));
    if (page >= (result.pagination?.totalPages ?? 1)) return items;
  }
}

const fetchLocations = (companyId: string, warehouseId: string) =>
  fetchAll<LocationRow>('/inventory/warehouse-locations', { companyId, warehouseId });

const locationLabel = (loc: LocationRow | undefined) => (loc ? loc.code || loc.nameAr : '');

/** Creates a draft count for the warehouse (or one location) and starts it. */
export async function startPhysicalCount(input: {
  companyId: string;
  warehouseId: string;
  locationId?: string;
}): Promise<{ id: string; reference: string; lines: number }> {
  const operation = await apiRequest<{ id: string }>('/inventory/warehouse-operations', {
    method: 'POST',
    throwOnError: true,
    body: { companyId: input.companyId, warehouseId: input.warehouseId, kind: 'physical_count', status: 'draft' },
  });
  try {
    const started = await apiRequest<{ reference: string; lines: number }>(
      `/inventory/warehouse-operations/${operation.id}/count/start`,
      { method: 'POST', throwOnError: true, body: { locationId: input.locationId || undefined } },
    );
    return { id: operation.id, ...started };
  } catch (error) {
    await apiRequest(`/inventory/warehouse-operations/${operation.id}`, { method: 'DELETE', silent: true }).catch(() => undefined);
    throw error;
  }
}

/** Blind sheet: no system quantity, so the counter records what is on the shelf. */
export async function downloadCountSheet(input: {
  companyId: string;
  warehouseId: string;
  operationId: string;
  reference: string;
}): Promise<void> {
  const [lines, locations] = await Promise.all([
    fetchAll<LineRow>('/inventory/warehouse-operation-lines', {
      companyId: input.companyId,
      operationId: input.operationId,
    }),
    fetchLocations(input.companyId, input.warehouseId),
  ]);
  const locationById = new Map(locations.map((loc) => [loc.id, loc]));
  const rows = lines
    .map((line) => ({ line, location: locationLabel(locationById.get(line.toLocationId ?? '')) }))
    .sort(
      (a, b) =>
        a.location.localeCompare(b.location, 'ar') ||
        (a.line.sku ?? '').localeCompare(b.line.sku ?? '') ||
        a.line.productName.localeCompare(b.line.productName, 'ar'),
    )
    .map(({ line, location }) => [line.id, location, line.sku ?? '', line.productName, '']);

  await downloadXlsxFromAoA(`ورقة-جرد-${input.reference}`, 'الجرد', [HEADER, ...rows]);
}

/**
 * Reads a filled sheet. Rows keep their line id; a row added by the counter
 * (item found but not listed) needs the location code and the item code.
 * An empty counted cell means "not counted" and is skipped.
 */
export async function parseCountResults(input: {
  companyId: string;
  warehouseId: string;
  file: File;
}): Promise<{ lines: CountResultLine[]; issues: CountSheetIssue[]; skipped: number }> {
  const XLSX = await import('xlsx');
  const workbook = /\.csv$/i.test(input.file.name)
    ? XLSX.read(await input.file.text(), { type: 'string' })
    : XLSX.read(await input.file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
  if (!sheet) return { lines: [], issues: [{ rowNumber: 0, message: 'الملف لا يحتوي على أي ورقة.' }], skipped: 0 };

  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' });
  const header = (table[0] ?? []).map(norm);
  const col = Object.fromEntries(
    (Object.keys(COLUMNS) as ColumnKey[]).map((key) => [
      key,
      header.findIndex((cell) => (COLUMNS[key] as readonly string[]).includes(cell)),
    ]),
  ) as Record<ColumnKey, number>;
  if (col.counted < 0 || (col.lineId < 0 && (col.sku < 0 || col.location < 0))) {
    return {
      lines: [],
      skipped: 0,
      issues: [{ rowNumber: 1, message: 'الملف لا يطابق ورقة الجرد. نزّل ورقة الجرد من المستند واملأ عمود «الكمية المعدودة».' }],
    };
  }
  const cell = (row: unknown[], key: ColumnKey) => (col[key] >= 0 ? String(row[col[key]] ?? '').trim() : '');

  let resolvers: { locationId: (label: string) => string | undefined; item: (sku: string) => SkuRow | undefined } | null =
    null;
  const getResolvers = async () => {
    if (resolvers) return resolvers;
    const [locations, products, variants] = await Promise.all([
      fetchLocations(input.companyId, input.warehouseId),
      fetchAll<SkuRow>('/inventory/products', { companyId: input.companyId }),
      fetchAll<SkuRow>('/inventory/product-variants', { companyId: input.companyId }),
    ]);
    const locationByLabel = new Map<string, string>();
    for (const loc of locations.filter((l) => l.locationType === 'internal')) {
      if (loc.code) locationByLabel.set(norm(loc.code), loc.id);
      locationByLabel.set(norm(loc.nameAr), loc.id);
    }
    const variantBySku = new Map(variants.filter((v) => v.sku).map((v) => [norm(v.sku), v]));
    const productBySku = new Map(products.filter((p) => p.sku).map((p) => [norm(p.sku), p]));
    resolvers = {
      locationId: (label) => locationByLabel.get(norm(label)),
      item: (sku) => variantBySku.get(norm(sku)) ?? productBySku.get(norm(sku)),
    };
    return resolvers;
  };

  const lines: CountResultLine[] = [];
  const issues: CountSheetIssue[] = [];
  let skipped = 0;
  for (const [index, row] of table.slice(1).entries()) {
    const rowNumber = index + 2;
    const rawCount = cell(row, 'counted');
    if (rawCount === '') {
      skipped += 1;
      continue;
    }
    const counted = Number(
      rawCount.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[,\s]/g, ''),
    );
    if (!Number.isFinite(counted) || counted < 0) {
      issues.push({ rowNumber, message: `الكمية المعدودة غير صحيحة (${rawCount}).` });
      continue;
    }

    const lineId = cell(row, 'lineId');
    if (lineId) {
      lines.push({ lineId, countedQuantity: counted });
      continue;
    }

    const sku = cell(row, 'sku');
    const location = cell(row, 'location');
    if (!sku || !location) {
      issues.push({ rowNumber, message: 'صف مضاف يحتاج «الموقع» و«رمز الصنف».' });
      continue;
    }
    const resolve = await getResolvers();
    const locationId = resolve.locationId(location);
    const item = resolve.item(sku);
    if (!locationId) {
      issues.push({ rowNumber, message: `الموقع «${location}» ليس موقع تخزين في هذا المستودع.` });
      continue;
    }
    if (!item) {
      issues.push({ rowNumber, message: `الصنف «${sku}» غير موجود.` });
      continue;
    }
    lines.push({
      productId: item.productId ?? item.id,
      variantId: item.productId ? item.id : null,
      locationId,
      countedQuantity: counted,
    });
  }
  return { lines, issues, skipped };
}

export async function submitCountResults(
  operationId: string,
  lines: CountResultLine[],
): Promise<{ updated: number; added: number }> {
  return apiRequest(`/inventory/warehouse-operations/${operationId}/count/results`, {
    method: 'POST',
    throwOnError: true,
    body: { lines },
  });
}
