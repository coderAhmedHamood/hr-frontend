'use client';

import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { PAYMENT_METHOD_LABELS, type PosPaymentMethod } from '@/features/pos/domain/types';
import { usePosContext } from '@/features/pos/hooks/use-pos-context';
import { round2 } from '@/features/pos/lib/calc';
import { formatMoney } from '@/features/pos/lib/format';
import { PosGate, PosPreviewNote, StatTile } from '@/features/pos/components/shared/pos-shared';

const PERIODS = [
  { id: 'today', label: 'اليوم', days: 0 },
  { id: '7', label: '7 أيام', days: 7 },
  { id: '30', label: '30 يومًا', days: 30 },
  { id: 'all', label: 'الكل', days: -1 },
] as const;

function inPeriod(iso: string | null, days: number): boolean {
  if (!iso) return false;
  if (days < 0) return true;
  const d = new Date(iso);
  if (days === 0) return d.toDateString() === new Date().toDateString();
  return Date.now() - d.getTime() <= days * 86_400_000;
}

function Table({ title, rows }: { title: string; rows: Array<[string, string, string?]> }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">لا بيانات في الفترة.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([a, b, c]) => (
              <tr key={a} className="border-t border-border/60 first:border-t-0">
                <td className="py-1.5">{a}</td>
                {c !== undefined ? <td className="py-1.5 text-muted-foreground">{c}</td> : null}
                <td className="py-1.5 text-end tabular-nums">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Reports() {
  const { data, currency } = usePosContext();
  const [period, setPeriod] = React.useState<(typeof PERIODS)[number]['id']>('today');
  const days = PERIODS.find((p) => p.id === period)!.days;

  const sales = data.sales.filter((s) => s.status === 'completed' && inPeriod(s.completedAt, days));
  const returns = data.returns.filter((r) => inPeriod(r.createdAt, days));
  const payments = data.sales.flatMap((s) => s.payments).filter((p) => p.status === 'succeeded' && inPeriod(p.createdAt, days));

  const gross = round2(sales.reduce((a, s) => a + s.totals.subtotal, 0));
  const discount = round2(sales.reduce((a, s) => a + s.totals.discount, 0));
  const net = round2(sales.reduce((a, s) => a + s.totals.total, 0));
  const tax = round2(sales.reduce((a, s) => a + s.totals.tax, 0));
  const returned = round2(returns.reduce((a, r) => a + r.refund.amount, 0));

  const byMethod = (Object.keys(PAYMENT_METHOD_LABELS) as PosPaymentMethod[]).map((m) => {
    const inAmount = round2(payments.filter((p) => p.method === m && p.kind === 'payment').reduce((a, p) => a + p.amount, 0));
    const refunds = round2(
      returns.filter((r) => r.refund.method === m && r.refund.status === 'done').reduce((a, r) => a + r.refund.amount, 0) +
        payments.filter((p) => p.method === m && p.kind === 'refund').reduce((a, p) => a + p.amount, 0),
    );
    return [PAYMENT_METHOD_LABELS[m], formatMoney(round2(inAmount - refunds), currency), `محصّل ${formatMoney(inAmount)} · مردود ${formatMoney(refunds)}`] as [string, string, string];
  });

  const group = <K extends string>(keyOf: (s: (typeof sales)[number]) => K) => {
    const map = new Map<K, { total: number; count: number }>();
    for (const s of sales) {
      const k = keyOf(s);
      const cur = map.get(k) ?? { total: 0, count: 0 };
      map.set(k, { total: round2(cur.total + s.totals.total), count: cur.count + 1 });
    }
    return [...map.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([k, v]) => [k, formatMoney(v.total, currency), `${v.count} مستند`] as [string, string, string]);
  };

  const items = new Map<string, { qty: number; total: number }>();
  for (const s of sales) {
    for (const l of s.lines) {
      const k = l.variantName ? `${l.name} — ${l.variantName}` : l.name;
      const cur = items.get(k) ?? { qty: 0, total: 0 };
      items.set(k, { qty: cur.qty + l.quantity - l.returnedQuantity, total: round2(cur.total + l.total) });
    }
  }
  const topItems = [...items.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([k, v]) => [k, formatMoney(v.total, currency), `${v.qty} قطعة`] as [string, string, string]);

  const differences = data.sessions
    .filter((s) => s.status === 'closed' && inPeriod(s.closedAt, days) && (s.difference ?? 0) !== 0)
    .map((s) => [s.cashierName, formatMoney(s.difference ?? 0, currency), s.differenceReason ?? ''] as [string, string, string]);

  const open = data.sales.filter((s) => s.status === 'awaiting_payment' || s.status === 'payment_exception');
  const damagedPending = data.returns.filter((r) => r.damagedDecision === 'pending').length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <SetPageTitle titleAr="تقارير نقاط البيع" iconName="BarChart3" />
      <PosPreviewNote />
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Button key={p.id} size="sm" variant={period === p.id ? 'default' : 'outline'} onClick={() => setPeriod(p.id)}>
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="إجمالي قبل الخصم" value={formatMoney(gross, currency)} />
        <StatTile label="الخصومات" value={formatMoney(discount, currency)} />
        <StatTile label="صافي المبيعات" value={formatMoney(net, currency)} hint={`${sales.length} مستند`} />
        <StatTile label="الضريبة" value={formatMoney(tax, currency)} />
        <StatTile label="المرتجعات" value={formatMoney(returned, currency)} hint={`${returns.length} مستند`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="المحصّل بوسيلة الدفع (صافي بعد الرد)" rows={byMethod} />
        <Table title="حسب الكاشير" rows={group((s) => s.cashierName)} />
        <Table title="حسب نقطة البيع" rows={group((s) => data.registers.find((r) => r.id === s.registerId)?.name ?? '—')} />
        <Table title="أعلى الأصناف" rows={topItems} />
        <Table title="فروقات النقد" rows={differences} />
        <Table
          title="تحتاج متابعة"
          rows={[
            ['مبيعات بانتظار الدفع أو استثناءات', String(open.length)],
            ['مرتجعات تالفة بانتظار قرار', String(damagedPending)],
            ['ردود مال بانتظار التنفيذ', String(data.returns.filter((r) => r.refund.status === 'pending').length)],
          ]}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        الربحية لا تظهر هنا: تحتاج مصدر تكلفة موثوقًا، وهو المخازن مع تفعيل التكلفة عند ربط نقاط البيع بها.
      </p>
    </div>
  );
}

export function PosReportsPage() {
  return (
    <PosGate permission="pos.reports.read">
      <Reports />
    </PosGate>
  );
}
