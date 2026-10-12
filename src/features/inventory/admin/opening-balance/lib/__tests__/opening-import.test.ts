/**
 * @jest-environment node
 */
import type { WarehouseLocation } from '@/features/inventory/domain/types/warehouse';
import type { OpeningSheetRow } from '../opening-sheet';
import { buildOpeningImportRequest, buildOpeningPlan, type OpeningProductRow } from '../opening-import';

const locations = [
  { id: 'loc-main', code: 'MAIN', nameAr: 'الرئيسي', locationType: 'internal', isActive: true },
  { id: 'loc-b', code: 'B', nameAr: 'رف ب', locationType: 'internal', isActive: true },
] as unknown as WarehouseLocation[];

const row = (patch: Partial<OpeningSheetRow>): OpeningSheetRow => ({
  rowNumber: 2,
  sku: '',
  nameAr: '',
  barcode: '',
  quantity: 1,
  unitCost: null,
  salePrice: null,
  location: 'MAIN',
  ...patch,
});

const products: OpeningProductRow[] = [
  { id: 'p1', nameAr: 'سكر', sku: 'S-1', barcode: '111' },
  { id: 'p2', nameAr: 'أرز', sku: 'R-1', barcode: '222' },
];

describe('buildOpeningPlan', () => {
  it('weights the merged cost only over rows that have a cost', () => {
    const plan = buildOpeningPlan({
      rows: [
        row({ rowNumber: 2, sku: 'S-1', quantity: 10, unitCost: 4 }),
        row({ rowNumber: 3, sku: 'S-1', quantity: 10, unitCost: null }),
        row({ rowNumber: 4, sku: 'S-1', quantity: 10, unitCost: 6 }),
      ],
      locations,
      products,
      variants: [],
    });
    expect(plan.issues).toEqual([]);
    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0]).toMatchObject({ productId: 'p1', quantity: 30, unitCost: 5, rowNumbers: [2, 3, 4] });
  });

  it('keeps separate lines per location', () => {
    const plan = buildOpeningPlan({
      rows: [row({ sku: 'S-1', location: 'MAIN' }), row({ sku: 'S-1', location: 'رف ب' })],
      locations,
      products,
      variants: [],
    });
    expect(plan.lines.map((l) => l.locationId)).toEqual(['loc-main', 'loc-b']);
  });

  it('reports a barcode shared by two items instead of picking one', () => {
    const plan = buildOpeningPlan({
      rows: [row({ barcode: '999' })],
      locations,
      products: [
        { id: 'a', nameAr: 'صنف أ', sku: 'A', barcode: '999' },
        { id: 'b', nameAr: 'صنف ب', sku: 'B', barcode: '999' },
      ],
      variants: [],
    });
    expect(plan.lines).toEqual([]);
    expect(plan.issues[0]!.message).toContain('«صنف أ»');
    expect(plan.issues[0]!.message).toContain('«صنف ب»');
  });

  it('reports a code that belongs to a variant and a product', () => {
    const plan = buildOpeningPlan({
      rows: [row({ sku: 'S-1' })],
      locations,
      products,
      variants: [{ id: 'v1', productId: 'p9', nameAr: 'سكر كبير', sku: 'S-1', barcode: null }],
    });
    expect(plan.issues[0]!.message).toContain('أكثر من صنف');
  });

  it('matches a variant by barcode', () => {
    const plan = buildOpeningPlan({
      rows: [row({ barcode: '777' })],
      locations,
      products,
      variants: [{ id: 'v1', productId: 'p1', nameAr: 'سكر 5 كغ', sku: 'S-1-5', barcode: '777' }],
    });
    expect(plan.lines[0]).toMatchObject({ productId: 'p1', variantId: 'v1' });
  });

  it('explains an archived code rather than creating a duplicate', () => {
    const plan = buildOpeningPlan({
      rows: [row({ sku: 'OLD-1', nameAr: 'صنف قديم' })],
      locations,
      products,
      variants: [],
      archivedProducts: [{ id: 'x', nameAr: 'صنف قديم', sku: 'OLD-1' }],
    });
    expect(plan.lines).toEqual([]);
    expect(plan.issues[0]!.message).toContain('مؤرشف');
  });

  it('groups new products by code across locations and keys lines safely', () => {
    const plan = buildOpeningPlan({
      rows: [
        row({ sku: 'N|1', nameAr: 'جديد', location: 'MAIN', unitCost: 2.123456 }),
        row({ sku: 'N|1', nameAr: 'جديد', location: 'B' }),
      ],
      locations,
      products,
      variants: [],
    });
    expect(plan.newProductCount).toBe(1);
    expect(plan.lines).toHaveLength(2);
    expect(new Set(plan.lines.map((l) => l.newProductKey)).size).toBe(1);

    const body = buildOpeningImportRequest({
      companyId: 'c',
      warehouseId: 'w',
      plan,
      sourceDocument: 'f.xlsx',
    });
    expect(body.newProducts).toHaveLength(1);
    expect(body.newProducts[0]).toMatchObject({ nameAr: 'جديد', sku: 'N|1', costPriceAmount: 2.1235 });
    expect(body.lines.every((l) => l.newProductKey === body.newProducts[0]!.key)).toBe(true);
    expect(body.confirmDuplicate).toBe(false);
  });

  it('asks for a name when an unknown barcode has none', () => {
    const plan = buildOpeningPlan({ rows: [row({ barcode: '000' })], locations, products, variants: [] });
    expect(plan.issues[0]!.message).toContain('أضف اسم الصنف');
  });

  it('reports an unknown location', () => {
    const plan = buildOpeningPlan({ rows: [row({ sku: 'S-1', location: 'X' })], locations, products, variants: [] });
    expect(plan.issues[0]!.message).toContain('«X»');
  });
});
