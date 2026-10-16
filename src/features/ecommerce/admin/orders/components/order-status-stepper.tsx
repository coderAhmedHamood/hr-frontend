'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
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
  isPaymentSettled,
  type OrderFlowStep,
} from '@/features/ecommerce/domain/constants/order-status';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import {
  OrderMoveDialog,
  type OrderStatusChangeExtra,
} from '@/features/ecommerce/admin/orders/components/order-move-dialog';
import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import { moveBlockReason } from '@/features/ecommerce/admin/orders/lib/order-stage-access';

export type { OrderStatusChangeExtra };

type Props = {
  order: Pick<Order, 'status' | 'items' | 'paymentMethod' | 'paymentStatus' | 'assignedUserId'>;
  companyId: string;
  /** Order stages: what the user may do (null: unknown, the backend decides). */
  stages?: OrderStagesContext | null;
  disabled?: boolean;
  /** Slimmer header — payment context lives outside the stepper. */
  compact?: boolean;
  /**
   * Phones: where the «التالي» button goes (a bar at the bottom of the
   * dialog, within thumb reach); it stays in place on larger screens.
   */
  mobileActionSlot?: HTMLElement | null;
  /** Hide footer “تأكيد التحصيل” when a primary CTA exists above. */
  hidePaymentConfirm?: boolean;
  onOrderStatusChange: (
    status: OrderStatus,
    note?: string | null,
    extra?: OrderStatusChangeExtra,
  ) => void;
  onPaymentPaid: () => void;
};

/**
 * Horizontal sequential status bar — fulfilment + payment.
 * Transitions follow backend `ORDER_STATUS_TRANSITIONS` (no arbitrary jumps).
 */
export function OrderStatusStepper({
  order,
  companyId,
  stages = null,
  disabled,
  compact = false,
  hidePaymentConfirm = false,
  mobileActionSlot = null,
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
  const [pending, setPending] = React.useState<OrderStatus | null>(null);
  const blockReason = (status: OrderStatus) => moveBlockReason(stages, order, status);

  function requestTransition(status: OrderStatus) {
    if (status === order.status) return;
    if (!canTransitionOrderStatus(order, status)) return;
    if (blockReason(status)) return;
    setPending(status);
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
  const nextStageBlock = next?.kind === 'order' ? blockReason(next.status) : null;
  const nextBlocked =
    Boolean(next) &&
    next?.kind === 'order' &&
    (!canTransitionOrderStatus(order, next.status) || Boolean(nextStageBlock));
  const terminalTargets = ORDER_TERMINAL_STATUSES.filter((terminal) =>
    allowed.includes(terminal),
  );

  const renderNext = (className?: string) =>
    next ? (
            <Button
              type="button"
              size="sm"
              disabled={disabled || nextBlocked}
              className={cn('gap-1', className)}
              title={
                nextStageBlock ??
                (nextBlocked && next.kind === 'order' && next.status === 'shipped'
                  ? 'يلزم شحن كل أصناف الطلب أولاً'
                  : undefined)
              }
              onClick={applyNext}
            >
              التالي: {next.label}
              <ChevronLeft className="h-4 w-4" />
            </Button>
    ) : null;

  return (
    <div className={cn('space-y-4 rounded-xl border border-border/80 bg-card', compact ? 'p-3' : 'p-4')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {compact ? 'تحديث الحالة' : 'مسار الطلب'}
          </p>
          {!compact ? (
            <>
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
        {next && inPipeline ? renderNext(mobileActionSlot ? 'max-sm:hidden' : undefined) : null}
        {next && inPipeline && mobileActionSlot
          ? createPortal(renderNext('h-12 w-full text-base sm:hidden'), mobileActionSlot)
          : null}
      </div>

      <ol className="flex items-start gap-0 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const done = inPipeline && currentIndex > index;
          const active = inPipeline && currentIndex === index;
          const upcoming = !inPipeline || currentIndex < index;
          const isLast = index === steps.length - 1;
          const stageBlock =
            step.kind === 'order' && step.status !== order.status ? blockReason(step.status) : null;
          const blocked =
            step.kind === 'order' &&
            step.status !== order.status &&
            (!canTransitionOrderStatus(order, step.status) || Boolean(stageBlock));

          return (
            // Phones: every step fits the width (no steps hidden off-screen).
            <li key={step.id} className={cn('flex min-w-0 flex-1 items-start', isLast && 'sm:flex-none sm:shrink-0')}>
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
                      stageBlock
                        ? stageBlock
                        : blocked
                        ? step.kind === 'order' && step.status === 'shipped'
                          ? 'يلزم شحن كل الأصناف ثم الانتقال من «قيد التجهيز»'
                          : 'انتقال غير مسموح من الحالة الحالية'
                        : active
                          ? 'الخطوة الحالية'
                          : step.label
                    }
                    onClick={() => applyStep(step)}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:h-9 sm:w-9',
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
                    'max-w-full text-center text-[10.5px] font-medium leading-tight sm:max-w-[5.5rem] sm:text-xs',
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
            disabled={disabled || order.status === terminal || Boolean(blockReason(terminal))}
            title={blockReason(terminal) ?? undefined}
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

      <OrderMoveDialog
        order={order}
        companyId={companyId}
        stages={stages}
        target={pending}
        onCancel={() => setPending(null)}
        onConfirm={(status, note, extra) => {
          onOrderStatusChange(status, note, extra);
          setPending(null);
        }}
      />
    </div>
  );
}
