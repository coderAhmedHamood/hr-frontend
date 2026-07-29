'use client';

import { Banknote, Check, ChevronLeft, CreditCard } from 'lucide-react';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_STATUS_LABELS_AR,
  ORDER_TERMINAL_STATUSES,
  PAYMENT_METHOD_LABELS_AR,
  buildOrderFlowSteps,
  canAdvanceOrderStatus,
  getOrderFlowCurrentIndex,
  getOrderFlowNextStep,
  isOrderPipelineStatus,
  isPaymentSettled,
  type OrderFlowStep,
} from '@/features/ecommerce/domain/constants/order-status';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

type Props = {
  order: Pick<Order, 'status' | 'paymentMethod' | 'paymentStatus'>;
  disabled?: boolean;
  onOrderStatusChange: (status: OrderStatus) => void;
  onPaymentPaid: () => void;
};

/**
 * Horizontal sequential status bar — fulfilment + payment.
 * شبكة: الدفع قبل التأكيد · كاش: الدفع بعد التسليم.
 */
export function OrderStatusStepper({ order, disabled, onOrderStatusChange, onPaymentPaid }: Props) {
  const paymentMethod = order.paymentMethod ?? 'cash_on_delivery';
  const steps = buildOrderFlowSteps(paymentMethod);
  const currentIndex = getOrderFlowCurrentIndex(order);
  const inPipeline = isOrderPipelineStatus(order.status);
  const next = getOrderFlowNextStep(order);
  const paid = isPaymentSettled(order);

  function applyStep(step: OrderFlowStep) {
    if (step.kind === 'payment') {
      onPaymentPaid();
      return;
    }
    if (!canAdvanceOrderStatus(order, step.status)) return;
    onOrderStatusChange(step.status);
  }

  function applyNext() {
    if (!next) return;
    applyStep(next);
  }

  const methodLabel = PAYMENT_METHOD_LABELS_AR[paymentMethod];
  const PaymentIcon = paymentMethod === 'card' ? CreditCard : Banknote;

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">مسار الطلب</p>
          <p className="text-xs text-muted-foreground">
            {paymentMethod === 'card'
              ? 'شبكة: الدفع يظهر قبل تأكيد الطلب.'
              : 'كاش عند الاستلام: الدفع يظهر كآخر مرحلة بعد التسليم.'}
          </p>
          <p className="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-foreground">
            <PaymentIcon className="h-3.5 w-3.5 text-muted-foreground" />
            نوع الدفع: {methodLabel}
            <span className="text-muted-foreground">·</span>
            {paid ? 'تم التحصيل' : 'لم يُحصَّل بعد'}
          </p>
        </div>
        {next && inPipeline ? (
          <Button type="button" size="sm" disabled={disabled} className="gap-1" onClick={applyNext}>
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
            step.kind === 'order' && !canAdvanceOrderStatus(order, step.status) && !done && !active;

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
                    disabled={disabled || blocked}
                    aria-current={active ? 'step' : undefined}
                    aria-label={step.label}
                    title={blocked ? 'أكمل دفع الشبكة أولًا' : step.label}
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
        {ORDER_TERMINAL_STATUSES.map((terminal) => (
          <Button
            key={terminal}
            type="button"
            size="sm"
            variant={order.status === terminal ? 'destructive' : 'outline'}
            disabled={disabled || order.status === terminal}
            onClick={() => onOrderStatusChange(terminal)}
          >
            {ORDER_STATUS_LABELS_AR[terminal]}
          </Button>
        ))}
        {!inPipeline ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => onOrderStatusChange('pending')}
          >
            إعادة إلى المسار
          </Button>
        ) : null}
        {inPipeline && !paid ? (
          <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={onPaymentPaid}>
            تأكيد التحصيل ({methodLabel})
          </Button>
        ) : null}
      </div>
    </div>
  );
}
