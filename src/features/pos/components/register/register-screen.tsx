'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRightLeft,
  ChevronRight,
  Clock,
  FileText,
  Lock,
  MonitorSmartphone,
  PauseCircle,
  PlayCircle,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils';
import type { PosDiscount, PosSale, PosSaleLine } from '@/features/pos/domain/types';
import { posRoutes } from '@/features/pos/constants/routes';
import { usePosContext } from '@/features/pos/hooks/use-pos-context';
import { discountPercentOf, paidAmount, priceLines, round2 } from '@/features/pos/lib/calc';
import { formatDateTime, formatMoney, parseAmount } from '@/features/pos/lib/format';
import { newId } from '@/features/pos/lib/pos-store';
import { saleToPrintable, sessionToPrintable } from '@/features/pos/lib/receipt';
import { summarizeSession } from '@/features/pos/lib/session-summary';
import { CloseSessionDialog } from '@/features/pos/components/shared/close-session-dialog';
import { PosGate, PrintPreviewDialog } from '@/features/pos/components/shared/pos-shared';
import {
  ApprovalDialog,
  CartPanel,
  CustomerDialog,
  LineEditDialog,
  OrderDiscountDialog,
  type CartState,
} from '@/features/pos/components/register/cart-panel';
import { PaymentDialog } from '@/features/pos/components/register/payment-dialog';
import { ProductPanel, type PickedItem } from '@/features/pos/components/register/product-panel';

const EMPTY_CART: CartState = { lines: [], orderDiscount: null, customer: { kind: 'walk_in' } };
const REGISTER_KEY = 'pos.register.current';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the cart just does not survive a reload.
  }
}

/* ── Register choice and shift opening ───────────────────────────────── */

function RegisterPicker({ onPick }: { onPick: (id: string) => void }) {
  const { data } = usePosContext();
  const active = data.registers.filter((r) => r.isActive);
  return (
    <div className="m-auto flex w-full max-w-lg flex-col gap-3 p-6">
      <h1 className="text-lg font-bold">اختر نقطة البيع</h1>
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          لا نقاط بيع نشطة. <Link className="text-primary underline" href={posRoutes.registers}>أنشئ نقطة بيع</Link>.
        </p>
      ) : (
        active.map((r) => {
          const open = data.sessions.find((s) => s.registerId === r.id && s.status === 'open');
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onPick(r.id)}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-start shadow-soft hover:border-primary/50"
            >
              <span>
                <span className="block font-semibold">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.code} · {r.branchName ?? 'بدون فرع'}</span>
              </span>
              {open ? <Badge variant="success">{open.cashierName}</Badge> : <Badge variant="outline">مغلقة</Badge>}
            </button>
          );
        })
      )}
    </div>
  );
}

function OpenShift({ registerId, onBack }: { registerId: string; onBack: () => void }) {
  const { data, actions, userId, userName, can, currency } = usePosContext();
  const register = data.registers.find((r) => r.id === registerId);
  const [float, setFloat] = React.useState('');
  const allowed = can('pos.session.open');
  const draining = Boolean(data.settings.stockModeChange);

  return (
    <div className="m-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div>
        <h1 className="text-lg font-bold">فتح وردية — {register?.name}</h1>
        <p className="text-sm text-muted-foreground">عُدّ النقد في الدرج وأدخله عهدةً للوردية.</p>
      </div>
      <div className="space-y-1.5">
        <Label>العهدة النقدية</Label>
        <Input autoFocus dir="ltr" inputMode="decimal" className="h-12 text-xl" placeholder="0.00" value={float} onChange={(e) => setFloat(e.target.value)} />
      </div>
      <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
        وضع المخزون لهذه الوردية: <b>{data.settings.stockMode === 'inventory' ? 'مربوط بالمخازن' : 'دون تتبع'}</b>. يبقى ثابتًا حتى الإغلاق.
      </div>
      {draining ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs">
          تبديل وضع المخزون قيد التنفيذ: لا تُفتح ورديات جديدة حتى يكتمل من إعدادات نقاط البيع.
        </p>
      ) : null}
      <Button
        className="h-12"
        disabled={!allowed || !actions || draining}
        onClick={() => {
          const id = actions?.openSession(registerId, userId, userName, round2(parseAmount(float)), data.settings.stockMode);
          if (id) toast.success(`فُتحت الوردية بعهدة ${formatMoney(parseAmount(float), currency)}`);
        }}
      >
        <PlayCircle className="h-5 w-5" />
        فتح الوردية
      </Button>
      {!allowed ? <p className="text-xs text-destructive">ليس لديك صلاحية فتح وردية.</p> : null}
      <Button variant="ghost" onClick={onBack}>نقطة بيع أخرى</Button>
    </div>
  );
}

/* ── Small dialogs of the screen ─────────────────────────────────────── */

function CashMoveDialog({ open, sessionId, onClose }: { open: boolean; sessionId: string; onClose: () => void }) {
  const { actions, userName } = usePosContext();
  const [type, setType] = React.useState<'in' | 'out'>('out');
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  React.useEffect(() => {
    setAmount('');
    setReason('');
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>حركة نقدية</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {(['in', 'out'] as const).map((t) => (
            <Button key={t} variant={type === t ? 'default' : 'outline'} onClick={() => setType(t)}>
              {t === 'in' ? 'قبض (إيداع في الدرج)' : 'صرف (من الدرج)'}
            </Button>
          ))}
        </div>
        <Input dir="ltr" inputMode="decimal" placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input placeholder="السبب" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            disabled={parseAmount(amount) <= 0 || !reason.trim()}
            onClick={() => {
              actions?.addCashMovement(sessionId, type, round2(parseAmount(amount)), reason.trim(), userName);
              toast.success('سُجّلت الحركة');
              onClose();
            }}
          >
            تسجيل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListsDialog({
  open,
  registerId,
  cartEmpty,
  onClose,
  onResumeSale,
  onResumeCart,
}: {
  open: boolean;
  registerId: string;
  cartEmpty: boolean;
  onClose: () => void;
  onResumeSale: (sale: PosSale) => void;
  onResumeCart: (cartId: string) => void;
}) {
  const { data, currency } = usePosContext();
  const openSales = data.sales.filter((s) => s.registerId === registerId && s.status === 'awaiting_payment');
  const held = data.heldCarts.filter((c) => c.registerId === registerId);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>مبيعات مفتوحة وسلال معلّقة</DialogTitle>
        </DialogHeader>
        {!cartEmpty ? <p className="text-xs text-warning">علّق السلة الحالية أو أفرغها قبل الاستئناف.</p> : null}
        <div className="space-y-4 text-sm">
          <div>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">بانتظار الدفع ({openSales.length})</div>
            {openSales.length === 0 ? <p className="text-xs text-muted-foreground">لا شيء.</p> : null}
            {openSales.map((s) => {
              const pending = s.payments.some((p) => p.status === 'pending' || p.status === 'unknown');
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 border-t border-border py-2">
                  <span>
                    {formatDateTime(s.createdAt)} · {s.lines.length} صنف · {formatMoney(s.totals.total, currency)}
                    {pending ? <Badge variant="warning" className="ms-2">محاولة بطاقة معلّقة</Badge> : null}
                    {paidAmount(s.payments) > 0 ? <Badge variant="outline" className="ms-2">مدفوع جزئيًا</Badge> : null}
                  </span>
                  <Button size="sm" disabled={!cartEmpty} onClick={() => onResumeSale(s)}>استئناف</Button>
                </div>
              );
            })}
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">سلال معلّقة ({held.length})</div>
            {held.length === 0 ? <p className="text-xs text-muted-foreground">لا شيء.</p> : null}
            {held.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 border-t border-border py-2">
                <span>
                  {c.label} · {formatDateTime(c.createdAt)} · {c.lines.length} صنف
                </span>
                <Button size="sm" disabled={!cartEmpty} onClick={() => onResumeCart(c.id)}>استئناف</Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── The register ────────────────────────────────────────────────────── */

function Register() {
  const router = useRouter();
  const params = useSearchParams();
  const ctx = usePosContext();
  const { companyId, data, actions, userId, userName, currency, can } = ctx;
  const settings = data.settings;

  const [registerId, setRegisterId] = React.useState<string | null>(null);
  React.useEffect(() => {
    setRegisterId(params.get('register') ?? readJson<string | null>(REGISTER_KEY, null));
  }, [params]);

  const register = data.registers.find((r) => r.id === registerId && r.isActive) ?? null;
  const session = register ? data.sessions.find((s) => s.registerId === register.id && s.status === 'open') ?? null : null;

  const cartKey = `pos.cart.${companyId}.${registerId}`;
  const [cart, setCartState] = React.useState<CartState>(EMPTY_CART);
  const [saleId, setSaleId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!registerId) return;
    setCartState(readJson(cartKey, EMPTY_CART));
    setSaleId(params.get('sale'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerId]);
  const setCart = (next: CartState) => {
    setCartState(next);
    writeJson(cartKey, next);
  };

  const [editing, setEditing] = React.useState<PosSaleLine | null>(null);
  const [customerOpen, setCustomerOpen] = React.useState(false);
  const [discountOpen, setDiscountOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [listsOpen, setListsOpen] = React.useState(false);
  const [cashOpen, setCashOpen] = React.useState(false);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [xOpen, setXOpen] = React.useState(false);
  const [receiptSaleId, setReceiptSaleId] = React.useState<string | null>(null);
  const [approval, setApproval] = React.useState<{ title: string; detail: string; onApprove: (s: string) => void } | null>(null);
  const [zSessionId, setZSessionId] = React.useState<string | null>(null);
  const zSession = zSessionId ? data.sessions.find((s) => s.id === zSessionId) ?? null : null;

  const pickRegister = (id: string) => {
    writeJson(REGISTER_KEY, id);
    setRegisterId(id);
    router.replace(`${posRoutes.register}?register=${id}`);
  };

  if (!register) return <RegisterPicker onPick={pickRegister} />;
  if (!session) {
    return (
      <>
        <OpenShift registerId={register.id} onBack={() => setRegisterId(null)} />
        <PrintPreviewDialog
          open={!!zSession}
          onOpenChange={(o) => !o && setZSessionId(null)}
          title="تقرير إغلاق الوردية (Z)"
          document={zSession ? sessionToPrintable(zSession, register, summarizeSession(data, zSession)) : null}
        />
      </>
    );
  }
  if (session.cashierId !== userId) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 p-6 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-warning" />
        <p className="text-sm">
          الوردية مفتوحة على هذه النقطة باسم <b>{session.cashierName}</b> منذ {formatDateTime(session.openedAt)}. لا يبيع أحد على وردية غيره.
        </p>
        {can('pos.session.close-others') ? (
          <Button variant="outline" onClick={() => setCloseOpen(true)}>إغلاق ورديته (مشرف)</Button>
        ) : null}
        <Button variant="ghost" onClick={() => setRegisterId(null)}>نقطة بيع أخرى</Button>
        <CloseSessionDialog session={closeOpen ? session : null} onOpenChange={setCloseOpen} />
      </div>
    );
  }

  const openSale = saleId ? data.sales.find((s) => s.id === saleId) ?? null : null;
  const locked = !!openSale && openSale.status === 'awaiting_payment';
  const priced = locked
    ? { lines: openSale!.lines, totals: openSale!.totals }
    : priceLines(cart.lines, cart.orderDiscount, settings.tax);
  const shownCart: CartState = locked
    ? { lines: openSale!.lines, orderDiscount: openSale!.orderDiscount, customer: openSale!.customer }
    : { ...cart, lines: priced.lines };

  const sessionSummary = summarizeSession(data, session);
  const waiting = data.sales.filter((s) => s.registerId === register.id && s.status === 'awaiting_payment').length;
  const heldCount = data.heldCarts.filter((c) => c.registerId === register.id).length;

  /* cart operations */

  const addItem = ({ product, variant }: PickedItem) => {
    if (locked) return;
    const same = cart.lines.find(
      (l) => l.productId === product.id && l.variantId === (variant?.id ?? null) && l.unitPrice === l.sourcePrice && !l.discount,
    );
    if (same) {
      setCart({ ...cart, lines: cart.lines.map((l) => (l.id === same.id ? { ...l, quantity: l.quantity + 1 } : l)) });
      return;
    }
    const price = variant?.price ?? product.price;
    const line: PosSaleLine = {
      id: newId(),
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantName: variant?.name ?? null,
      sku: variant?.sku ?? product.sku,
      quantity: 1,
      sourcePrice: price,
      unitPrice: price,
      discount: null,
      discountAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      total: price,
      returnedQuantity: 0,
    };
    setCart({ ...cart, lines: [...cart.lines, line] });
  };

  /** A discount within the cashier limit applies; above it needs a supervisor (or is refused). */
  const withDiscountCheck = (base: number, discount: PosDiscount | null, label: string, apply: () => void) => {
    const percent = discountPercentOf(base, discount);
    if (percent <= settings.discounts.cashierMaxPercent) return apply();
    if (!settings.discounts.supervisorApprovalAbove) {
      toast.error(`أعلى خصم مسموح ${settings.discounts.cashierMaxPercent}%`);
      return;
    }
    setApproval({
      title: 'موافقة مشرف على الخصم',
      detail: `${label}: ${percent.toFixed(1)}% يتجاوز حد الكاشير ${settings.discounts.cashierMaxPercent}%.`,
      onApprove: (supervisor) => {
        actions?.logAudit(userName, 'discount_over_limit', `${label} ${percent.toFixed(1)}% بموافقة ${supervisor}`);
        apply();
      },
    });
  };

  const saveLine = (patch: { quantity: number; discount: PosDiscount | null; unitPrice: number }) => {
    if (!editing) return;
    const apply = () => {
      if (patch.unitPrice !== editing.unitPrice) {
        actions?.logAudit(userName, 'price_override', `${editing.name}: ${editing.unitPrice} ← ${patch.unitPrice}`);
      }
      setCart({ ...cart, lines: cart.lines.map((l) => (l.id === editing.id ? { ...l, ...patch } : l)) });
      setEditing(null);
    };
    withDiscountCheck(patch.unitPrice * patch.quantity, patch.discount, editing.name, apply);
  };

  const pay = () => {
    if (!actions) return;
    if (locked) {
      setPayOpen(true);
      return;
    }
    if (cart.lines.length === 0) return;
    // Commit: prices and snapshot fixed in the "server"; stock reserved there when linked.
    const id = actions.commitSale({
      registerId: register.id,
      sessionId: session.id,
      cashierName: userName,
      stockSource: session.stockMode,
      customer: cart.customer,
      lines: priced.lines,
      orderDiscount: cart.orderDiscount,
      totals: priced.totals,
    });
    if (!id) return;
    setCart(EMPTY_CART);
    setSaleId(id);
    setPayOpen(true);
  };

  const cancelOpenSale = () => {
    if (!openSale || !actions) return;
    const pending = openSale.payments.some((p) => p.kind === 'payment' && (p.status === 'pending' || p.status === 'unknown'));
    if (pending) {
      toast.error('احسم محاولة البطاقة المعلّقة أولًا (تمت / رُفضت / لم يُخصم).');
      return;
    }
    if (paidAmount(openSale.payments) > 0) {
      actions.markException(openSale.id, 'أُلغي بعد تحصيل مبلغ: يحتاج رد المال أو معالجة من المشرف.');
      toast.warning('حُوّل البيع إلى «استثناء دفع» لمعالجة المبلغ المحصّل.');
    } else {
      actions.cancelSale(openSale.id, 'إلغاء قبل الدفع', userName);
      toast.success('أُلغي البيع وحُرّر الحجز');
    }
    setSaleId(null);
  };

  const receiptSale = receiptSaleId ? data.sales.find((s) => s.id === receiptSaleId) ?? null : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2">
        <Button asChild size="sm" variant="ghost">
          <Link href={posRoutes.overview}>
            <ChevronRight className="h-4 w-4" />
            نقاط البيع
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          <b>{register.name}</b>
          <span className="text-muted-foreground">· {userName}</span>
          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <Clock className="h-3 w-3" />
            {formatDateTime(session.openedAt)}
          </span>
          <Badge variant={session.stockMode === 'inventory' ? 'default' : 'outline'}>
            {session.stockMode === 'inventory' ? 'مربوط بالمخازن' : 'دون تتبع'}
          </Badge>
        </div>
        <div className="ms-auto flex flex-wrap gap-1">
          <Button size="sm" variant="outline" onClick={() => setListsOpen(true)}>
            <PauseCircle className="h-4 w-4" />
            المعلّقة {waiting + heldCount > 0 ? `(${waiting + heldCount})` : ''}
          </Button>
          {can('pos.cash.move') ? (
            <Button size="sm" variant="outline" onClick={() => setCashOpen(true)}>
              <ArrowRightLeft className="h-4 w-4" />
              حركة نقدية
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setXOpen(true)}>
            <FileText className="h-4 w-4" />
            تقرير X
          </Button>
          {can('pos.return') ? (
            <Button asChild size="sm" variant="outline">
              <Link href={posRoutes.returns}>
                <Receipt className="h-4 w-4" />
                مرتجع
              </Link>
            </Button>
          ) : null}
          {can('pos.session.close') ? (
            <Button size="sm" variant="outline" onClick={() => setCloseOpen(true)}>
              <Lock className="h-4 w-4" />
              إغلاق الوردية
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className={cn('flex min-h-0 flex-col', locked && 'pointer-events-none opacity-60')}>
          {companyId ? (
            <ProductPanel
              companyId={companyId}
              onlyPosAvailable={settings.onlyPosAvailableProducts}
              disabled={locked}
              onPick={addItem}
            />
          ) : null}
        </div>
        <CartPanel
          cart={shownCart}
          totals={priced.totals}
          currency={currency}
          locked={locked}
          lockedLabel={
            locked ? (
              <div className="flex items-center justify-between gap-2">
                <span>
                  بيع مثبّت بانتظار الدفع{session.stockMode === 'inventory' ? '، والكمية محجوزة' : ''}. المدفوع{' '}
                  {formatMoney(paidAmount(openSale!.payments), currency)}.
                </span>
                <Button size="sm" variant="ghost" className="h-7" onClick={cancelOpenSale}>
                  إلغاء البيع
                </Button>
              </div>
            ) : undefined
          }
          canDiscount={can('pos.discount')}
          onQuantity={(lineId, delta) =>
            setCart({
              ...cart,
              lines: cart.lines.map((l) => (l.id === lineId ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l)),
            })
          }
          onEditLine={(line) => setEditing(cart.lines.find((l) => l.id === line.id) ?? null)}
          onRemoveLine={(lineId) => setCart({ ...cart, lines: cart.lines.filter((l) => l.id !== lineId) })}
          onCustomer={() => setCustomerOpen(true)}
          onOrderDiscount={() => setDiscountOpen(true)}
          onHold={() => {
            actions?.holdCart({
              registerId: register.id,
              label: cart.customer.kind === 'named' ? cart.customer.name : `سلة ${heldCount + 1}`,
              lines: cart.lines,
              customer: cart.customer,
              orderDiscount: cart.orderDiscount,
            });
            setCart(EMPTY_CART);
            toast.success('عُلّقت السلة');
          }}
          onVoid={() => {
            actions?.voidCart(userName, cart.lines.length, priced.totals.total);
            setCart(EMPTY_CART);
          }}
          onPay={pay}
        />
      </div>

      <LineEditDialog
        line={editing}
        canDiscount={can('pos.discount')}
        canOverridePrice={settings.discounts.allowPriceOverride && can('pos.price.override')}
        onClose={() => setEditing(null)}
        onSave={saveLine}
      />
      <OrderDiscountDialog
        open={discountOpen}
        value={cart.orderDiscount}
        onClose={() => setDiscountOpen(false)}
        onSave={(d) =>
          withDiscountCheck(priced.totals.subtotal, d, 'خصم الفاتورة', () => {
            setCart({ ...cart, orderDiscount: d });
            setDiscountOpen(false);
          })
        }
      />
      <CustomerDialog
        open={customerOpen}
        value={cart.customer}
        onClose={() => setCustomerOpen(false)}
        onSave={(c) => {
          setCart({ ...cart, customer: c });
          setCustomerOpen(false);
        }}
      />
      <ApprovalDialog request={approval} onClose={() => setApproval(null)} />
      {payOpen && saleId ? (
        <PaymentDialog
          saleId={saleId}
          sessionId={session.id}
          onClose={() => setPayOpen(false)}
          onCompleted={(number) => {
            setPayOpen(false);
            setReceiptSaleId(saleId);
            setSaleId(null);
            toast.success(`اكتمل البيع ${number}`);
          }}
        />
      ) : null}
      <ListsDialog
        open={listsOpen}
        registerId={register.id}
        cartEmpty={cart.lines.length === 0 && !locked}
        onClose={() => setListsOpen(false)}
        onResumeSale={(s) => {
          setSaleId(s.id);
          setListsOpen(false);
          setPayOpen(true);
        }}
        onResumeCart={(id) => {
          const held = data.heldCarts.find((c) => c.id === id);
          if (!held) return;
          setCart({ lines: held.lines, orderDiscount: held.orderDiscount, customer: held.customer });
          actions?.dropHeldCart(id);
          setListsOpen(false);
        }}
      />
      <CashMoveDialog open={cashOpen} sessionId={session.id} onClose={() => setCashOpen(false)} />
      <CloseSessionDialog
        session={closeOpen ? session : null}
        onOpenChange={setCloseOpen}
        onClosed={() => setZSessionId(session.id)}
      />
      <PrintPreviewDialog
        open={xOpen}
        onOpenChange={setXOpen}
        title="تقرير الوردية (X)"
        document={sessionToPrintable(session, register, sessionSummary)}
      />
      <PrintPreviewDialog
        open={!!receiptSale}
        onOpenChange={(o) => !o && setReceiptSaleId(null)}
        title={`الإيصال ${receiptSale?.number ?? ''}`}
        document={receiptSale ? saleToPrintable(receiptSale, register) : null}
        footer={
          <Button variant="outline" onClick={() => setReceiptSaleId(null)}>
            بيع جديد
          </Button>
        }
      />
    </div>
  );
}

export function PosRegisterScreen() {
  return (
    <PosGate permission="pos.sell">
      <Register />
    </PosGate>
  );
}
