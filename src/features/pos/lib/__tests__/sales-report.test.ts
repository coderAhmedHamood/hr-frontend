import type { PosSale, PosSaleLine } from '@/features/pos/domain/types';
import { EMPTY_POS_DATA, type PosCompanyData } from '@/features/pos/lib/pos-store';
import {
  GROUPINGS,
  NO_FILTERS,
  groupBy,
  lineFacts,
  paymentRows,
  totalsOf,
} from '@/features/pos/lib/sales-report';

/**
 * Each sale keeps the price it was sold at and the cost fixed at that moment:
 * the same item bought at 7 then at 9 and sold at 10 then 12 gives the profit
 * of each sale, not of today's cost.
 */
const line = (over: Partial<PosSaleLine>): PosSaleLine => ({
  id: 'l',
  productId: 'p1',
  variantId: null,
  name: 'قهوة',
  variantName: null,
  sku: 'CF',
  quantity: 1,
  sourcePrice: 10,
  unitPrice: 10,
  discount: null,
  discountAmount: 0,
  taxRate: 0,
  taxAmount: 0,
  total: 10,
  returnedQuantity: 0,
  unitCost: null,
  costSource: null,
  categoryId: 'c1',
  categoryName: 'مشروبات',
  ...over,
});

const sale = (id: string, completedAt: string, lines: PosSaleLine[], cashierName = 'سارة'): PosSale => ({
  id,
  number: `POS1-${id}`,
  registerId: 'r1',
  sessionId: 's1',
  cashierName,
  status: 'completed',
  stockSource: 'none',
  customer: { kind: 'walk_in' },
  lines,
  orderDiscount: null,
  totals: {
    subtotal: lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0),
    discount: lines.reduce((a, l) => a + l.discountAmount, 0),
    tax: lines.reduce((a, l) => a + l.taxAmount, 0),
    total: lines.reduce((a, l) => a + l.total, 0),
  },
  payments: [
    {
      id: `pay-${id}`,
      kind: 'payment',
      method: 'cash',
      amount: lines.reduce((a, l) => a + l.total, 0),
      status: 'succeeded',
      reference: null,
      tendered: null,
      change: null,
      sessionId: 's1',
      createdAt: completedAt,
    },
  ],
  revisions: [],
  createdAt: completedAt,
  completedAt,
  cancelledAt: null,
  exceptionReason: null,
});

const data = (sales: PosSale[]): PosCompanyData => ({
  ...EMPTY_POS_DATA,
  registers: [
    { id: 'r1', name: 'الكاشير 1', code: 'POS1', branchId: null, branchName: null, warehouseName: null, isActive: true, createdAt: '', nextSequence: 1 },
  ],
  sales,
});

describe('sales report', () => {
  const first = sale('1', '2026-10-01T09:00:00', [
    line({ id: 'a', quantity: 2, unitPrice: 10, total: 20, unitCost: 7, costSource: 'purchase_price' }),
  ]);
  const second = sale('2', '2026-10-02T15:00:00', [
    line({ id: 'b', quantity: 3, unitPrice: 12, sourcePrice: 12, total: 36, unitCost: 9, costSource: 'purchase_price' }),
  ], 'خالد');

  it('profit uses the cost each sale had, not one cost for the item', () => {
    const t = totalsOf(lineFacts(data([first, second]), NO_FILTERS));
    expect(t.revenue).toBe(56);
    expect(t.cost).toBe(2 * 7 + 3 * 9);
    expect(t.profit).toBe(56 - 41);
    expect(t.margin).toBe(26.79);
    expect(t.invoices).toBe(2);
    expect(t.units).toBe(5);
  });

  it('a loss shows as a negative profit', () => {
    const atLoss = sale('3', '2026-10-03T10:00:00', [
      line({ id: 'c', quantity: 1, unitPrice: 5, total: 5, unitCost: 8 }),
    ]);
    expect(totalsOf(lineFacts(data([atLoss]), NO_FILTERS)).profit).toBe(-3);
  });

  it('a return takes its share of revenue and cost off the sale', () => {
    const withReturn = sale('4', '2026-10-03T10:00:00', [
      line({ id: 'd', quantity: 4, unitPrice: 10, total: 40, unitCost: 6, returnedQuantity: 1 }),
    ]);
    const t = totalsOf(lineFacts(data([withReturn]), NO_FILTERS));
    expect(t.revenue).toBe(30);
    expect(t.cost).toBe(18);
    expect(t.profit).toBe(12);
    expect(t.returned).toBe(10);
  });

  it('tax is not revenue; discounts lower it', () => {
    const taxed = sale('5', '2026-10-03T10:00:00', [
      line({ id: 'e', quantity: 1, unitPrice: 100, discountAmount: 10, taxAmount: 13.5, total: 103.5, unitCost: 50 }),
    ]);
    const t = totalsOf(lineFacts(data([taxed]), NO_FILTERS));
    expect(t.revenue).toBe(90);
    expect(t.tax).toBe(13.5);
    expect(t.discount).toBe(10);
    expect(t.profit).toBe(40);
  });

  it('revenue without a cost is kept apart from profit', () => {
    const old = sale('6', '2026-10-03T10:00:00', [line({ id: 'f', quantity: 1, total: 10 })]);
    const costed = sale('7', '2026-10-03T11:00:00', [line({ id: 'g', quantity: 1, total: 10, unitCost: 4 })]);
    const t = totalsOf(lineFacts(data([old, costed]), NO_FILTERS));
    expect(t.revenue).toBe(20);
    expect(t.costedRevenue).toBe(10);
    expect(t.uncostedRevenue).toBe(10);
    expect(t.profit).toBe(6);
  });

  it('filters by date, cashier and product; groups by cashier and day', () => {
    const d = data([first, second]);
    expect(lineFacts(d, { ...NO_FILTERS, from: '2026-10-02' })).toHaveLength(1);
    expect(lineFacts(d, { ...NO_FILTERS, cashierName: 'سارة' })[0]!.saleId).toBe('1');
    expect(lineFacts(d, { ...NO_FILTERS, product: 'شاي' })).toHaveLength(0);
    const byCashier = groupBy(lineFacts(d, NO_FILTERS), GROUPINGS.cashier);
    expect(byCashier.map((r) => [r.label, r.revenue, r.profit])).toEqual([
      ['خالد', 36, 9],
      ['سارة', 20, 6],
    ]);
    expect(groupBy(lineFacts(d, NO_FILTERS), GROUPINGS.day).map((r) => r.key).sort()).toEqual([
      '2026-10-01',
      '2026-10-02',
    ]);
  });

  it('payment rows sum what was collected for the kept sales', () => {
    const rows = paymentRows(data([first, second]), NO_FILTERS);
    expect(rows.find((r) => r.method === 'cash')).toMatchObject({ collected: 56, net: 56, count: 2 });
  });
});
