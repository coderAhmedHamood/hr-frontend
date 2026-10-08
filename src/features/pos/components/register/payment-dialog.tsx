'use client';

import * as React from 'react';
import { Banknote, CheckCircle2, CreditCard, Landmark, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils';
import { PAYMENT_METHOD_LABELS, type PosPaymentMethod } from '@/features/pos/domain/types';
import { usePosContext } from '@/features/pos/hooks/use-pos-context';
import { paidAmount, round2 } from '@/features/pos/lib/calc';
import { formatAmount, formatMoney, parseAmount } from '@/features/pos/lib/format';

const METHOD_ICONS: Record<PosPaymentMethod, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Landmark,
};

/**
 * Payment of a committed sale. Each payment is saved the moment it is
 * recorded, so nothing is lost if the screen closes. A card on an external
 * terminal starts as a pending attempt *before* the terminal is charged; it
 * then becomes approved (with its code), declined, or "not charged".
 */
export function PaymentDialog({
  saleId,
  sessionId,
  onClose,
  onCompleted,
}: {
  saleId: string | null;
  sessionId: string;
  onClose: () => void;
  onCompleted: (number: string) => void;
}) {
  const { data, actions, currency } = usePosContext();
  const sale = data.sales.find((s) => s.id === saleId) ?? null;
  const enabledMethods = (Object.keys(PAYMENT_METHOD_LABELS) as PosPaymentMethod[]).filter((m) => data.settings.paymentMethods[m]);
  const [method, setMethod] = React.useState<PosPaymentMethod>(enabledMethods[0] ?? 'cash');
  const [amount, setAmount] = React.useState('');
  const [tendered, setTendered] = React.useState('');
  const [reference, setReference] = React.useState('');

  const paid = sale ? paidAmount(sale.payments) : 0;
  const remaining = sale ? round2(sale.totals.total - paid) : 0;
  const pendingCard = sale?.payments.find((p) => p.kind === 'payment' && (p.status === 'pending' || p.status === 'unknown')) ?? null;

  React.useEffect(() => {
    setAmount(remaining > 0 ? String(remaining) : '');
    setTendered('');
    setReference('');
  }, [remaining, method, saleId]);

  if (!sale || !actions) return null;

  const applied = Math.min(parseAmount(amount), remaining);
  const tenderedValue = parseAmount(tendered);
  const cashApplied = method === 'cash' ? Math.min(tenderedValue || applied, remaining) : applied;
  const change = method === 'cash' && tenderedValue > remaining ? round2(tenderedValue - remaining) : 0;

  const record = () => {
    if (method === 'cash') {
      const value = round2(tenderedValue ? Math.min(tenderedValue, remaining) : applied);
      if (value <= 0) return;
      actions.addPayment(sale.id, {
        kind: 'payment',
        method: 'cash',
        amount: value,
        status: 'succeeded',
        reference: null,
        tendered: tenderedValue || value,
        change: change || null,
        sessionId,
      });
    } else if (method === 'transfer') {
      if (applied <= 0 || !reference.trim()) return;
      actions.addPayment(sale.id, {
        kind: 'payment',
        method: 'transfer',
        amount: round2(applied),
        status: 'succeeded',
        reference: reference.trim(),
        tendered: null,
        change: null,
        sessionId,
      });
    }
  };

  const startCard = () => {
    if (applied <= 0) return;
    actions.addPayment(sale.id, {
      kind: 'payment',
      method: 'card',
      amount: round2(applied),
      status: 'pending',
      reference: null,
      tendered: null,
      change: null,
      sessionId,
    });
  };

  const complete = () => {
    const number = actions.completeSale(sale.id);
    if (number) onCompleted(number);
  };

  const canComplete = remaining === 0 && !pendingCard;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>الدفع</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground">الإجمالي</div>
            <div className="text-lg font-bold tabular-nums">{formatAmount(sale.totals.total)}</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-xs text-muted-foreground">المدفوع</div>
            <div className="text-lg font-bold tabular-nums text-success">{formatAmount(paid)}</div>
          </div>
          <div className={cn('rounded-lg p-2', remaining > 0 ? 'bg-warning/10' : 'bg-success/10')}>
            <div className="text-xs text-muted-foreground">المتبقي</div>
            <div className="text-lg font-bold tabular-nums">{formatAmount(remaining)}</div>
          </div>
        </div>

        {sale.payments.length > 0 ? (
          <ul className="space-y-1 rounded-md border border-border p-2 text-xs">
            {sale.payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>
                  {PAYMENT_METHOD_LABELS[p.method]}
                  {p.reference ? ` · ${p.reference}` : ''}
                  {p.status === 'pending' ? ' · قيد التنفيذ على الجهاز' : ''}
                  {p.status === 'declined' ? ' · مرفوضة' : ''}
                  {p.status === 'cancelled' ? ' · لم يُخصم' : ''}
                  {p.change ? ` · الباقي ${formatAmount(p.change)}` : ''}
                </span>
                <span className={cn('tabular-nums', p.status !== 'succeeded' && 'text-muted-foreground line-through')}>
                  {formatAmount(p.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {pendingCard ? (
          <PendingCardPanel saleId={sale.id} paymentId={pendingCard.id} amount={pendingCard.amount} />
        ) : remaining > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {enabledMethods.map((m) => {
                const Icon = METHOD_ICONS[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-3 text-sm',
                      method === m ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {PAYMENT_METHOD_LABELS[m]}
                  </button>
                );
              })}
            </div>

            {method === 'cash' ? (
              <div className="space-y-2">
                <Label>المبلغ المستلم من العميل</Label>
                <Input
                  autoFocus
                  dir="ltr"
                  inputMode="decimal"
                  className="h-12 text-xl"
                  placeholder={formatAmount(remaining)}
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && record()}
                />
                <div className="flex flex-wrap gap-1">
                  {[remaining, Math.ceil(remaining / 10) * 10, Math.ceil(remaining / 50) * 50, Math.ceil(remaining / 100) * 100]
                    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                    .map((v) => (
                      <Button key={v} size="sm" variant="outline" onClick={() => setTendered(String(v))}>
                        {formatAmount(v)}
                      </Button>
                    ))}
                </div>
                {change > 0 ? (
                  <div className="rounded-md bg-success/10 p-2 text-center text-lg font-bold">الباقي للعميل {formatMoney(change, currency)}</div>
                ) : null}
                <Button className="w-full" onClick={record} disabled={cashApplied <= 0}>
                  تسجيل النقد
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>المبلغ (لجزء نقدي وجزء {method === 'card' ? 'بطاقة' : 'تحويل'} عدّل المبلغ)</Label>
                <Input dir="ltr" inputMode="decimal" className="h-11 text-lg" value={amount} onChange={(e) => setAmount(e.target.value)} />
                {method === 'card' ? (
                  <>
                    <Button className="w-full" onClick={startCard} disabled={applied <= 0}>
                      <CreditCard className="h-4 w-4" />
                      بدء الدفع بالبطاقة
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      يُسجَّل بدء المحاولة أولًا، ثم نفّذ العملية على جهاز الدفع. إن انقطع شيء بعدها تبقى المحاولة معلّقة ولا يُحصَّل مرتين.
                    </p>
                  </>
                ) : (
                  <>
                    <Input placeholder="رقم مرجع التحويل" dir="ltr" value={reference} onChange={(e) => setReference(e.target.value)} />
                    <Button className="w-full" onClick={record} disabled={applied <= 0 || !reference.trim()}>
                      تسجيل التحويل
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="flex gap-2 border-t border-border pt-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            إغلاق (يبقى البيع مفتوحًا)
          </Button>
          <Button onClick={complete} disabled={!canComplete} className="flex-1">
            <CheckCircle2 className="h-4 w-4" />
            إتمام البيع
          </Button>
        </div>
        {remaining > 0 && sale.payments.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            ترك مبلغ متبقٍ يجعله بيعًا آجلًا، وهو غير متاح في هذا الإصدار. أكمل المبلغ بوسيلة أخرى.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PendingCardPanel({ saleId, paymentId, amount }: { saleId: string; paymentId: string; amount: number }) {
  const { actions, userName, currency } = usePosContext();
  const [code, setCode] = React.useState('');
  if (!actions) return null;
  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Loader2 className="h-4 w-4 animate-spin" />
        نفّذ {formatMoney(amount, currency)} على جهاز الدفع
      </div>
      <div className="space-y-1">
        <Label className="text-xs">رقم الموافقة من الجهاز</Label>
        <Input autoFocus dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} className="h-10" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          disabled={!code.trim()}
          onClick={() => {
            actions.updatePayment(saleId, paymentId, { status: 'succeeded', reference: code.trim() });
            toast.success('تمت الموافقة');
          }}
        >
          <CheckCircle2 className="h-4 w-4" />
          تمت
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            actions.updatePayment(saleId, paymentId, { status: 'declined' });
            toast.error('رُفضت البطاقة');
          }}
        >
          <XCircle className="h-4 w-4" />
          رُفضت
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            actions.updatePayment(saleId, paymentId, { status: 'cancelled' });
            actions.logAudit(userName, 'payment_not_charged', saleId);
          }}
        >
          لم يُخصم
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        لا تبدأ محاولة جديدة قبل حسم هذه. إن لم تتأكد من النتيجة، راجع سجل الجهاز، أو اترك البيع مفتوحًا ليحسمه المشرف.
      </p>
    </div>
  );
}
