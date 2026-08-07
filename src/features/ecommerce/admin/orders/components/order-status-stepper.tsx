'use client';

import * as React from 'react';
import { Banknote, Check, ChevronLeft, CreditCard } from 'lucide-react';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_STATUS_LABELS_AR,
  ORDER_TERMINAL_STATUSES,
  PAYMENT_METHOD_LABELS_AR,
  buildOrderFlowSteps,
  canTransitionOrderStatus,
  getAllowedOrderStatusTransitions,
  getOrderFlowCurrentIndex,
  getOrderFlowNextStep,
  isOrderPipelineStatus,
  isOrderStatusNoteRecommended,
  isPaymentSettled,
  type OrderFlowStep,
} from '@/features/ecommerce/domain/constants/order-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

type Props = {
  order: Pick<Order, 'status' | 'items' | 'paymentMethod' | 'paymentStatus'>;
  disabled?: boolean;
  /** Slimmer header — payment context lives outside the stepper. */
  compact?: boolean;
  /** Hide footer “تأكيد التحصيل” when a primary CTA exists above. */
  hidePaymentConfirm?: boolean;
  onOrderStatusChange: (status: OrderStatus, note?: string | null) => void;
  onPaymentPaid: () => void;
};

type PendingTransition = {
  status: OrderStatus;
  noteRecommended: boolean;
};

/**
 * Horizontal sequential status bar — fulfilment + payment.
 * Transitions follow backend `ORDER_STATUS_TRANSITIONS` (no arbitrary jumps).
 */
export function OrderStatusStepper({
  order,
  disabled,
  compact = false,
  hidePaymentConfirm = false,
  onOrderStatusChange,
  onPaymentPaid,
}: Props) {
  const paymentMethod = order.paymentMethod ?? 'cash_on_delivery';
  const steps = buildOrderFlowSteps(paymentMethod);
  const currentIndex = getOrderFlowCurrentIndex(order);
  const inPipeline = isOrderPipelineStatus(order.status);
  const next = getOrderFlowNextStep(order);
  const paid = isPaymentSettled(order);
  const allowed = React.useMemo(() => getAllowedOrderStatusTransitions(order), [order]);
  const [pending, setPending] = React.useState<PendingTransition | null>(null);
  const [note, setNote] = React.useState('');

  function requestTransition(status: OrderStatus) {
    if (status === order.status) return;
    if (!canTransitionOrderStatus(order, status)) return;
    setNote('');
    setPending({
      status,
      noteRecommended: isOrderStatusNoteRecommended(order.status, status),
    });
  }

  function confirmTransition() {
    if (!pending) return;
    const trimmed = note.trim();
    onOrderStatusChange(pending.status, trimmed || null);
    setPending(null);
    setNote('');
  }

  function applyStep(step: OrderFlowStep) {
    if (step.kind === 'payment') {
      if (paid) return;
      onPaymentPaid();
      return;
    }
    requestTransition(step.status);
  }

  function applyNext() {
    if (!next || next.kind !== 'order') {
      if (next) applyStep(next);
      return;
    }
    if (!canTransitionOrderStatus(order, next.status)) return;
    applyStep(next);
  }

  const methodLabel = PAYMENT_METHOD_LABELS_AR[paymentMethod];
  const PaymentIcon = paymentMethod === 'card' ? CreditCard : Banknote;
  const nextBlocked =
    Boolean(next) &&
    next?.kind === 'order' &&
    !canTransitionOrderStatus(order, next.status);
  const terminalTargets = ORDER_TERMINAL_STATUSES.filter((terminal) =>
    allowed.includes(terminal),
  );

  return (
    <div className={cn('space-y-4 rounded-xl border border-border/80 bg-card', compact ? 'p-3' : 'p-4')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {compact ? 'تحديث الحالة' : 'مسار الطلب'}
          </p>
          {!compact ? (
            <>
              <p className="text-xs text-muted-foreground">
                الانتقالات مقيّدة حسب حالة الطلب الحالية (الباك اند هو نقطة التحكم).
              </p>
              <p className="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-foreground">
                <PaymentIcon className="h-3.5 w-3.5 text-muted-foreground" />
                نوع الدفع: {methodLabel}
                <span className="text-muted-foreground">·</span>
                {paid ? 'تم التحصيل' : 'لم يُحصَّل بعد'}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">الخطوات المتاحة فقط حسب قواعد الانتقال</p>
          )}
        </div>
        {next && inPipeline ? (
          <Button
            type="button"
            size="sm"
            disabled={disabled || nextBlocked}
            className="gap-1"
            title={
              nextBlocked && next.kind === 'order' && next.status === 'shipped'
                ? 'يلزم شحن كل أصناف الطلب أولاً'
                : undefined
            }
            onClick={applyNext}
          >
            التالي: {next.label}
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <ol className="flex items-start gap-0 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const done = inPipeline && currentIndex > index;
          const active = inPipeline && currentIndex === index;
          const upcoming = !inPipeline || currentIndex < index;
          const isLast = index === steps.length - 1;
          const blocked =
            step.kind === 'order' &&
            step.status !== order.status &&
            !canTransitionOrderStatus(order, step.status);

          return (
            <li key={step.id} className={cn('flex min-w-[4.25rem] items-start sm:min-w-0', isLast ? 'shrink-0' : 'flex-1')}>
              <div className="flex w-full min-w-0 flex-col items-center gap-1.5">
                <div className="flex w-full items-center">
                  {index > 0 ? (
                    <div
                      className={cn('h-0.5 flex-1 rounded-full', done || active ? 'bg-primary' : 'bg-border')}
                      aria-hidden
                    />
                  ) : (
                    <div className="flex-1" aria-hidden />
                  )}
                  <button
                    type="button"
                    disabled={disabled || blocked || active}
                    aria-current={active ? 'step' : undefined}
                    aria-label={step.label}
                    title={
                      blocked
                        ? step.kind === 'order' && step.status === 'shipped'
                          ? 'يلزم شحن كل الأصناف ثم الانتقال من «قيد التجهيز»'
                          : 'انتقال غير مسموح من الحالة الحالية'
                        : active
                          ? 'الخطوة الحالية'
                          : step.label
                    }
                    onClick={() => applyStep(step)}
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                      step.kind === 'payment' && !done && !active && 'border-dashed',
                      done && 'border-primary bg-primary text-primary-foreground',
                      active &&
                        (step.kind === 'payment'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-700 ring-2 ring-amber-500/25 dark:text-amber-400'
                          : 'border-primary bg-primary/15 text-primary ring-2 ring-primary/25'),
                      upcoming && 'border-border bg-background text-muted-foreground hover:border-primary/40',
                      active && 'cursor-default',
                      (disabled || blocked) && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : step.kind === 'payment' ? (
                      <PaymentIcon className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
                  </button>
                  {!isLast ? (
                    <div
                      className={cn('h-0.5 flex-1 rounded-full', done ? 'bg-primary' : 'bg-border')}
                      aria-hidden
                    />
                  ) : (
                    <div className="flex-1" aria-hidden />
                  )}
                </div>
                <span
                  className={cn(
                    'max-w-[5rem] text-center text-[11px] font-medium leading-tight sm:max-w-[5.5rem] sm:text-xs',
                    active
                      ? step.kind === 'payment'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-primary'
                      : done
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
        {terminalTargets.map((terminal) => (
          <Button
            key={terminal}
            type="button"
            size="sm"
            variant={order.status === terminal ? 'destructive' : 'outline'}
            disabled={disabled || order.status === terminal}
            onClick={() => requestTransition(terminal)}
          >
            {ORDER_STATUS_LABELS_AR[terminal]}
          </Button>
        ))}
        {inPipeline && !paid && !hidePaymentConfirm ? (
          <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={onPaymentPaid}>
            تأكيد التحصيل ({methodLabel})
          </Button>
        ) : null}
      </div>

      <Dialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
            setNote('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pending ? `تغيير الحالة إلى «${ORDER_STATUS_LABELS_AR[pending.status]}»` : 'تغيير الحالة'}
            </DialogTitle>
            <DialogDescription>
              {pending?.noteRecommended
                ? 'يُفضَّل إضافة ملاحظة عند التراجع أو الإلغاء/الاسترداد.'
                : 'ملاحظة اختيارية تُسجَّل في سجل الحالة.'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="ملاحظة الموظف (اختياري)"
            maxLength={500}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPending(null);
                setNote('');
              }}
            >
              إلغاء
            </Button>
            <Button type="button" onClick={confirmTransition}>
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
