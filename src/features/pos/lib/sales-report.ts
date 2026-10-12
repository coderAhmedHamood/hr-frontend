import {
  PAYMENT_METHOD_LABELS,
  type PosPaymentMethod,
  type PosReturn,
  type PosSale,
} from '@/features/pos/domain/types';
import type { PosCompanyData } from '@/features/pos/lib/pos-store';
import { round2 } from '@/features/pos/lib/calc';

/**
 * POS sales reports, computed from the sales as sold: each line keeps the
 * price it was sold at and the unit cost the server fixed at that moment, so
 * a later price or purchase-cost change never rewrites a past report.
 *
 * - Revenue is net of discounts and without tax (what the shop earns).
 * - Returns are taken off the sale they belong to, at that sale's price and
 *   cost (returned quantity / sold quantity of the line).
 * - Cost and profit count only lines with a known cost; revenue without a
 *   cost (older sales, items with no purchase price) is shown apart.
 */

export type ReportFilters = {
  /** Inclusive local dates, YYYY-MM-DD; null = open. */
  from: string | null;
  to: string | null;
  registerId: string | null;
  cashierName: string | null;
  categoryId: string | null;
  paymentMethod: PosPaymentMethod | null;
  /** Name or SKU contains. */
  product: string;
};

export const NO_FILTERS: ReportFilters = {
  from: null,
  to: null,
  registerId: null,
  cashierName: null,
  categoryId: null,
  paymentMethod: null,
  product: '',
};

/** One sold line, with everything a report groups or sums by. */
export type LineFact = {
  saleId: string;
  saleNumber: string;
  date: string;
  day: string;
  hour: number;
  registerId: string;
  registerName: string;
  sessionId: string;
  cashierName: string;
  customer: string;
  productKey: string;
  productName: string;
  sku: string;
  categoryId: string | null;
  categoryName: string;
  soldQty: number;
  returnedQty: number;
  netQty: number;
  /** Price × quantity before any discount (tax as priced). */
  gross: number;
  discount: number;
  /** Net of discounts and returns, without tax. */
  revenue: number;
  tax: number;
  /** Amount taken back by returns (with tax). */
  returned: number;
  priceOverridden: boolean;
  unitPrice: number;
  sourcePrice: number;
  unitCost: number | null;
  /** unitCost × net quantity; null when the cost is unknown. */
  cost: number | null;
};

export type Totals = {
  invoices: number;
  units: number;
  gross: number;
  discount: number;
  returned: number;
  revenue: number;
  tax: number;
  /** Revenue of lines with a cost: the base of profit and margin. */
  costedRevenue: number;
  uncostedRevenue: number;
  cost: number;
  profit: number;
  /** Profit / costed revenue, in %; null without costed revenue. */
  margin: number | null;
  averageInvoice: number;
};

export type GroupRow = Totals & { key: string; label: string; detail?: string };

const dayOf = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function saleMatches(sale: PosSale, f: ReportFilters): boolean {
  if (sale.status !== 'completed' || !sale.completedAt) return false;
  const day = dayOf(sale.completedAt);
  if (f.from && day < f.from) return false;
  if (f.to && day > f.to) return false;
  if (f.registerId && sale.registerId !== f.registerId) return false;
  if (f.cashierName && sale.cashierName !== f.cashierName) return false;
  if (
    f.paymentMethod &&
    !sale.payments.some(
      (p) => p.kind === 'payment' && p.status === 'succeeded' && p.method === f.paymentMethod,
    )
  ) {
    return false;
  }
  return true;
}

/** The sold lines of the completed sales the filters keep. */
export function lineFacts(data: PosCompanyData, f: ReportFilters): LineFact[] {
  const registers = new Map(data.registers.map((r) => [r.id, r.name]));
  const product = f.product.trim().toLowerCase();
  const out: LineFact[] = [];
  for (const sale of data.sales) {
    if (!saleMatches(sale, f)) continue;
    const date = sale.completedAt!;
    for (const line of sale.lines) {
      if (f.categoryId && (line.categoryId ?? null) !== f.categoryId) continue;
      const name = line.variantName ? `${line.name} — ${line.variantName}` : line.name;
      if (product && !name.toLowerCase().includes(product) && !line.sku.toLowerCase().includes(product)) {
        continue;
      }
      const sold = line.quantity;
      if (sold <= 0) continue;
      const returnedQty = Math.min(line.returnedQuantity, sold);
      const netQty = sold - returnedQty;
      const keep = netQty / sold;
      const exTax = line.total - line.taxAmount;
      const unitCost = typeof line.unitCost === 'number' ? line.unitCost : null;
      out.push({
        saleId: sale.id,
        saleNumber: sale.number ?? sale.id.slice(0, 8),
        date,
        day: dayOf(date),
        hour: new Date(date).getHours(),
        registerId: sale.registerId,
        registerName: registers.get(sale.registerId) ?? '—',
        sessionId: sale.sessionId,
        cashierName: sale.cashierName,
        customer: sale.customer.kind === 'named' ? sale.customer.name : 'عميل عابر',
        productKey: `${line.productId}|${line.variantId ?? ''}`,
        productName: name,
        sku: line.sku,
        categoryId: line.categoryId ?? null,
        categoryName: line.categoryName ?? 'بلا فئة',
        soldQty: sold,
        returnedQty,
        netQty,
        gross: round2(line.unitPrice * sold),
        discount: line.discountAmount,
        revenue: round2(exTax * keep),
        tax: round2(line.taxAmount * keep),
        returned: round2(line.total * (returnedQty / sold)),
        priceOverridden: Math.abs(line.unitPrice - line.sourcePrice) > 0.004,
        unitPrice: line.unitPrice,
        sourcePrice: line.sourcePrice,
        unitCost,
        cost: unitCost == null ? null : round2(unitCost * netQty),
      });
    }
  }
  return out;
}

export function totalsOf(facts: LineFact[]): Totals {
  const invoices = new Set(facts.map((f) => f.saleId)).size;
  let units = 0;
  let gross = 0;
  let discount = 0;
  let returned = 0;
  let revenue = 0;
  let tax = 0;
  let costedRevenue = 0;
  let cost = 0;
  for (const f of facts) {
    units += f.netQty;
    gross += f.gross;
    discount += f.discount;
    returned += f.returned;
    revenue += f.revenue;
    tax += f.tax;
    if (f.cost != null) {
      costedRevenue += f.revenue;
      cost += f.cost;
    }
  }
  const profit = round2(costedRevenue - cost);
  return {
    invoices,
    units: Math.round(units * 10000) / 10000,
    gross: round2(gross),
    discount: round2(discount),
    returned: round2(returned),
    revenue: round2(revenue),
    tax: round2(tax),
    costedRevenue: round2(costedRevenue),
    uncostedRevenue: round2(revenue - costedRevenue),
    cost: round2(cost),
    profit,
    margin: costedRevenue > 0.004 ? round2((profit / costedRevenue) * 100) : null,
    averageInvoice: invoices > 0 ? round2((revenue + tax) / invoices) : 0,
  };
}

/** Rows grouped by `keyOf`, biggest revenue first. */
export function groupBy(
  facts: LineFact[],
  keyOf: (f: LineFact) => { key: string; label: string; detail?: string },
): GroupRow[] {
  const groups = new Map<string, { label: string; detail?: string; facts: LineFact[] }>();
  for (const f of facts) {
    const k = keyOf(f);
    const g = groups.get(k.key) ?? { label: k.label, detail: k.detail, facts: [] };
    g.facts.push(f);
    groups.set(k.key, g);
  }
  return [...groups.entries()]
    .map(([key, g]) => ({ key, label: g.label, detail: g.detail, ...totalsOf(g.facts) }))
    .sort((a, b) => b.revenue - a.revenue);
}

export const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const GROUPINGS = {
  product: (f: LineFact) => ({ key: f.productKey, label: f.productName, detail: f.sku }),
  category: (f: LineFact) => ({ key: f.categoryId ?? '', label: f.categoryName }),
  day: (f: LineFact) => ({ key: f.day, label: f.day }),
  hour: (f: LineFact) => ({
    key: String(f.hour).padStart(2, '0'),
    label: `${String(f.hour).padStart(2, '0')}:00 – ${String((f.hour + 1) % 24).padStart(2, '0')}:00`,
  }),
  weekday: (f: LineFact) => {
    const d = new Date(f.date).getDay();
    return { key: String(d), label: WEEKDAYS_AR[d]! };
  },
  cashier: (f: LineFact) => ({ key: f.cashierName, label: f.cashierName }),
  register: (f: LineFact) => ({ key: f.registerId, label: f.registerName }),
  session: (f: LineFact) => ({
    key: f.sessionId,
    label: `${f.registerName} · ${f.cashierName}`,
    detail: f.sessionId.slice(0, 8),
  }),
  customer: (f: LineFact) => ({ key: f.customer, label: f.customer }),
  invoice: (f: LineFact) => ({
    key: f.saleId,
    label: f.saleNumber,
    detail: `${f.day} · ${f.cashierName}`,
  }),
} as const;

export type Grouping = keyof typeof GROUPINGS;

/** Hours / days in order instead of by revenue. */
export function sortedForTime(grouping: Grouping, rows: GroupRow[]): GroupRow[] {
  if (grouping === 'day' || grouping === 'hour' || grouping === 'weekday') {
    return [...rows].sort((a, b) => a.key.localeCompare(b.key));
  }
  return rows;
}

/** Collected per payment method, net of refunds, for the sales kept. */
export function paymentRows(
  data: PosCompanyData,
  f: ReportFilters,
): Array<{ method: PosPaymentMethod; label: string; collected: number; refunded: number; net: number; count: number }> {
  const sales = data.sales.filter((s) => saleMatches(s, f));
  const ids = new Set(sales.map((s) => s.id));
  return (Object.keys(PAYMENT_METHOD_LABELS) as PosPaymentMethod[]).map((method) => {
    const payments = sales.flatMap((s) => s.payments).filter((p) => p.status === 'succeeded' && p.method === method);
    const collected = round2(payments.filter((p) => p.kind === 'payment').reduce((a, p) => a + p.amount, 0));
    const refundedOnSale = payments.filter((p) => p.kind === 'refund').reduce((a, p) => a + p.amount, 0);
    const refundedByReturns = data.returns
      .filter((r) => ids.has(r.saleId) && r.refund.method === method && r.refund.status === 'done')
      .reduce((a, r) => a + r.refund.amount, 0);
    const refunded = round2(refundedOnSale + refundedByReturns);
    return {
      method,
      label: PAYMENT_METHOD_LABELS[method],
      collected,
      refunded,
      net: round2(collected - refunded),
      count: payments.filter((p) => p.kind === 'payment').length,
    };
  });
}

/** Returns made in the period (by their own date). */
export function returnsInPeriod(data: PosCompanyData, f: ReportFilters): PosReturn[] {
  return data.returns
    .filter((r) => {
      const day = dayOf(r.createdAt);
      if (f.from && day < f.from) return false;
      if (f.to && day > f.to) return false;
      if (f.registerId) {
        const sale = data.sales.find((s) => s.id === r.saleId);
        if (sale?.registerId !== f.registerId) return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Lines sold with a discount or a changed price. */
export function discountedLines(facts: LineFact[]): LineFact[] {
  return facts
    .filter((f) => f.discount > 0.004 || f.priceOverridden)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export { dayOf };
