import type {
  PosDiscount,
  PosSaleLine,
  PosSaleTotals,
  PosSettings,
} from '@/features/pos/domain/types';

/** Money is rounded to 2 places at every stored step, in integer cents. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function discountOf(base: number, discount: PosDiscount | null): number {
  if (!discount || discount.value <= 0 || base <= 0) return 0;
  const raw = discount.type === 'percent' ? (base * Math.min(discount.value, 100)) / 100 : discount.value;
  return round2(Math.min(raw, base));
}

/** Percent a discount represents of `base` (for the cashier limit). */
export function discountPercentOf(base: number, discount: PosDiscount | null): number {
  if (!discount || base <= 0) return 0;
  return discount.type === 'percent' ? discount.value : (discount.value / base) * 100;
}

/**
 * Recomputes every line snapshot: line discount, its share of the sale
 * discount (spread by net value, remainder on the last line), tax, total.
 */
export function priceLines(
  lines: PosSaleLine[],
  orderDiscount: PosDiscount | null,
  tax: PosSettings['tax'],
): { lines: PosSaleLine[]; totals: PosSaleTotals } {
  const rate = tax.enabled ? tax.rate : 0;
  const gross = lines.map((l) => round2(l.unitPrice * l.quantity));
  const lineDiscounts = lines.map((l, i) => discountOf(gross[i]!, l.discount));
  const nets = gross.map((g, i) => round2(g - lineDiscounts[i]!));
  const netSum = round2(nets.reduce((a, b) => a + b, 0));
  const orderAmount = discountOf(netSum, orderDiscount);

  let allocated = 0;
  const priced = lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    const share = isLast
      ? round2(orderAmount - allocated)
      : netSum > 0
        ? round2((orderAmount * nets[i]!) / netSum)
        : 0;
    allocated = round2(allocated + share);
    const net = round2(nets[i]! - share);
    const taxAmount = rate
      ? tax.pricesIncludeTax
        ? round2((net * rate) / (100 + rate))
        : round2((net * rate) / 100)
      : 0;
    const total = tax.pricesIncludeTax ? net : round2(net + taxAmount);
    return {
      ...line,
      discountAmount: round2(lineDiscounts[i]! + share),
      taxRate: rate,
      taxAmount,
      total,
    };
  });

  const totals: PosSaleTotals = {
    subtotal: round2(gross.reduce((a, b) => a + b, 0)),
    discount: round2(priced.reduce((a, l) => a + l.discountAmount, 0)),
    tax: round2(priced.reduce((a, l) => a + l.taxAmount, 0)),
    total: round2(priced.reduce((a, l) => a + l.total, 0)),
  };
  return { lines: priced, totals };
}

/** Refund for `quantity` units of a sold line, from its snapshot. */
export function lineRefundAmount(line: PosSaleLine, quantity: number): number {
  if (line.quantity <= 0) return 0;
  return round2((line.total * quantity) / line.quantity);
}

export function paidAmount(payments: Array<{ kind: string; status: string; amount: number }>): number {
  return round2(
    payments
      .filter((p) => p.kind === 'payment' && p.status === 'succeeded')
      .reduce((a, p) => a + p.amount, 0),
  );
}
