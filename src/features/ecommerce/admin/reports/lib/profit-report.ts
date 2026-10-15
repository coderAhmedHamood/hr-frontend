import { apiRequest } from '@/features/hr/lib/api/client';
import { PAYMENT_METHOD_LABELS_AR } from '@/features/ecommerce/domain/constants/order-status';

/**
 * Store profit report, from the lines as sold: each line keeps the price it
 * was sold at and the unit cost of that moment (the purchase price, which
 * follows inventory while costing runs), so a later purchase or price change
 * never rewrites a past report.
 *
 * - Revenue is the products' total (delivery fees apart), net of returns.
 * - A received return comes off its line at that line's price and cost.
 * - Cost and profit count only lines with a known cost; revenue without one
 *   (older orders, products with no purchase price) is shown apart.
 */

export type ProfitLine = {
  lineId: string;
  orderId: string;
  orderNumber: string;
  orderedAt: string;
  status: string;
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string | null;
  categoryId: string | null;
  categoryName: string | null;
  quantity: number;
  returnedQuantity: number;
  lineTotal: string;
  unitCost: string | null;
  customerName: string;
  city: string | null;
  paymentMethod: string;
  source: string;
  currencyCode: string;
};

export type ProfitQuery = {
  companyId: string;
  from?: string;
  to?: string;
  status?: string;
  categoryId?: string;
};

export async function fetchProfitLines(query: ProfitQuery): Promise<ProfitLine[]> {
  return apiRequest<ProfitLine[]>('/store-admin/reports/sales/profit-lines', {
    query: {
      companyId: query.companyId,
      from: query.from || undefined,
      to: query.to || undefined,
      status: query.status || undefined,
      categoryId: query.categoryId || undefined,
    },
    throwOnError: true,
  });
}

export type Fact = {
  orderId: string;
  orderNumber: string;
  date: string;
  day: string;
  hour: number;
  productKey: string;
  productName: string;
  sku: string;
  categoryId: string | null;
  categoryName: string;
  customer: string;
  city: string;
  paymentMethod: string;
  netQty: number;
  returnedQty: number;
  revenue: number;
  unitCost: number | null;
  /** unitCost × net quantity; null when the cost is unknown. */
  cost: number | null;
};

export type Totals = {
  orders: number;
  units: number;
  revenue: number;
  costedRevenue: number;
  uncostedRevenue: number;
  cost: number;
  profit: number;
  /** Profit / costed revenue, in %; null without costed revenue. */
  margin: number | null;
};

export type GroupRow = Totals & { key: string; label: string; detail?: string };

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number) => String(n).padStart(2, '0');

export const dayOf = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function factsOf(lines: ProfitLine[], search: string): Fact[] {
  const needle = search.trim().toLowerCase();
  const out: Fact[] = [];
  for (const l of lines) {
    if (
      needle &&
      !l.productName.toLowerCase().includes(needle) &&
      !(l.sku ?? '').toLowerCase().includes(needle)
    ) {
      continue;
    }
    const qty = Number(l.quantity) || 0;
    const returnedQty = Math.min(qty, Number(l.returnedQuantity) || 0);
    const netQty = qty - returnedQty;
    const revenue = qty > 0 ? (Number(l.lineTotal) * netQty) / qty : 0;
    const unitCost = l.unitCost == null ? null : Number(l.unitCost);
    const d = new Date(l.orderedAt);
    out.push({
      orderId: l.orderId,
      orderNumber: l.orderNumber,
      date: l.orderedAt,
      day: dayOf(l.orderedAt),
      hour: d.getHours(),
      productKey: `${l.productId}:${l.variantId ?? ''}`,
      productName: l.productName,
      sku: l.sku ?? '',
      categoryId: l.categoryId,
      categoryName: l.categoryName ?? 'بدون فئة',
      customer: l.customerName || '—',
      city: l.city || '—',
      paymentMethod: l.paymentMethod,
      netQty,
      returnedQty,
      revenue,
      unitCost,
      cost: unitCost == null ? null : unitCost * netQty,
    });
  }
  return out;
}

export function totalsOf(facts: Fact[]): Totals {
  let units = 0;
  let revenue = 0;
  let costedRevenue = 0;
  let cost = 0;
  for (const f of facts) {
    units += f.netQty;
    revenue += f.revenue;
    if (f.cost != null) {
      costedRevenue += f.revenue;
      cost += f.cost;
    }
  }
  const profit = round2(costedRevenue - cost);
  return {
    orders: new Set(facts.map((f) => f.orderId)).size,
    units: Math.round(units * 10000) / 10000,
    revenue: round2(revenue),
    costedRevenue: round2(costedRevenue),
    uncostedRevenue: round2(revenue - costedRevenue),
    cost: round2(cost),
    profit,
    margin: costedRevenue > 0.004 ? round2((profit / costedRevenue) * 100) : null,
  };
}

/** Rows grouped by `keyOf`, biggest revenue first. */
export function groupBy(
  facts: Fact[],
  keyOf: (f: Fact) => { key: string; label: string; detail?: string },
): GroupRow[] {
  const groups = new Map<string, { label: string; detail?: string; facts: Fact[] }>();
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

const paymentLabel = (m: string) =>
  (PAYMENT_METHOD_LABELS_AR as Record<string, string>)[m] ?? m;

export const GROUPINGS = {
  product: (f: Fact) => ({ key: f.productKey, label: f.productName, detail: f.sku }),
  category: (f: Fact) => ({ key: f.categoryId ?? '', label: f.categoryName }),
  day: (f: Fact) => ({ key: f.day, label: f.day }),
  weekday: (f: Fact) => {
    const d = new Date(f.date).getDay();
    return { key: String(d), label: WEEKDAYS_AR[d]! };
  },
  hour: (f: Fact) => ({
    key: pad(f.hour),
    label: `${pad(f.hour)}:00 – ${pad((f.hour + 1) % 24)}:00`,
  }),
  order: (f: Fact) => ({ key: f.orderId, label: f.orderNumber, detail: `${f.day} · ${f.customer}` }),
  customer: (f: Fact) => ({ key: f.customer, label: f.customer }),
  city: (f: Fact) => ({ key: f.city, label: f.city }),
  payment: (f: Fact) => ({ key: f.paymentMethod, label: paymentLabel(f.paymentMethod) }),
} as const;

export type Grouping = keyof typeof GROUPINGS;

/** Hours / days in order instead of by revenue. */
export function sortedForTime(grouping: Grouping, rows: GroupRow[]): GroupRow[] {
  if (grouping === 'day' || grouping === 'hour' || grouping === 'weekday') {
    return [...rows].sort((a, b) => a.key.localeCompare(b.key));
  }
  return rows;
}

const numberFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatAmount(value: number): string {
  return numberFormat.format(Number.isFinite(value) ? value : 0);
}

export function formatMoney(value: number, currencyCode?: string | null): string {
  const amount = formatAmount(value);
  return currencyCode ? `${amount} ${currencyCode}` : amount;
}
