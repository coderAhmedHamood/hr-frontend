'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Banknote, Check, ChevronLeft, CreditCard, MoreHorizontal, NotebookPen } from 'lucide-react';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS_AR,
  ORDER_TERMINAL_STATUSES,
  PAYMENT_METHOD_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
  buildOrderFlowSteps,
  canAdvanceOrderStatus,
  canTransitionOrderStatus,
  getAllowedOrderStatusTransitions,
  getOrderFlowCurrentIndex,
  getOrderFlowNextStep,
  isOrderPipelineStatus,
  isPaymentSettled,
  type OrderFlowStep,
} from '@/features/ecommerce/domain/constants/order-status';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/shared/utils';
import {
  OrderMoveDialog,
  orderMoveNeedsInput,
  type OrderStatusChangeExtra,
} from '@/features/ecommerce/admin/orders/components/order-move-dialog';
import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import { isViewOnlyOrder, moveBlockReason } from '@/features/ecommerce/admin/orders/lib/order-stage-access';

export type { OrderStatusChangeExtra };

type Props = {
  order: Pick<
    Order,
    'status' | 'items' | 'paymentMethod' | 'paymentStatus' | 'assignedUserId' | 'paymentAccountSnapshot'
  >;
  companyId: string;
  /** Order stages: what the user may do (null: unknown, the backend decides). */
  stages?: OrderStagesContext | null;
  disabled?: boolean;
  /** Tighter padding. */
  compact?: boolean;
  /**
   * Phones: where the next step goes as one tappable chip (a bar at the
   * bottom of the dialog, within thumb reach).
   */
  mobileActionSlot?: HTMLElement | null;
  /**
   * The payment step's actions (proof, confirm payment), shown in a small
   * panel when the payment step is tapped. Without it, tapping the payment
   * step confirms the payment directly.
   */
  renderPaymentActions?: (close: () => void) => React.ReactNode;
  onOrderStatusChange: (
    status: OrderStatus,
    note?: string | null,
    extra?: OrderStatusChangeExtra,
  ) => void;
  onPaymentPaid: () => void;
};

/**
 * Horizontal sequential status bar — fulfilment + payment. Tapping a step
 * moves the order to it in one tap (a dialog only when input is needed:
 * cancel, refund, cash collected on delivery); «⋯» moves with a note or a
 * chosen handler. A step that may not be reached says why. Transitions
 * follow backend `ORDER_STATUS_TRANSITIONS`.
 */
export function OrderStatusStepper({
  order,
  companyId,
  stages = null,
  disabled,
  compact = false,
  renderPaymentActions,
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

  function requestTransition(status: OrderStatus, withDialog = false) {
    if (status === order.status) return;
    if (!canTransitionOrderStatus(order, status)) return;
    if (blockReason(status)) return;
    if (withDialog || orderMoveNeedsInput(order, status)) {
      setPending(status);
      return;
    }
    // One tap: the stage settings pick the handler.
    onOrderStatusChange(status, null, {});
  }

  const [paymentOpen, setPaymentOpen] = React.useState(false);
  // Why the tapped step may not be reached (phones show no hover title).
  const [hint, setHint] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  /** Why a move to `status` is refused (null: allowed or the current step). */
  function stepBlockReason(status: OrderStatus): string | null {
    if (status === order.status) return null;
    const stageBlock = blockReason(status);
    if (stageBlock) return stageBlock;
    if (canTransitionOrderStatus(order, status)) return null;
    if (!canAdvanceOrderStatus(order, status)) return 'أكّد الدفع أولاً — هذا الطلب مدفوع مسبقاً';
    if (status === 'shipped') return 'يلزم شحن كل الأصناف ثم الانتقال من «قيد التجهيز»';
    return 'انتقال غير مسموح من الحالة الحالية';
  }

  function applyStep(step: OrderFlowStep) {
    if (step.kind === 'payment') {
      setHint(null);
      if (renderPaymentActions) {
        setPaymentOpen(true);
        return;
      }
      if (paid) return;
      onPaymentPaid();
      return;
    }
    const reason = stepBlockReason(step.status);
    setHint(reason);
    if (reason) return;
    requestTransition(step.status);
  }

  const PaymentIcon = paymentMethod === 'card' ? CreditCard : Banknote;
  const paymentStateLabel = PAYMENT_STATUS_LABELS_AR[order.paymentStatus ?? 'pending'];
  const account = order.paymentAccountSnapshot ?? null;
  const terminalTargets = ORDER_TERMINAL_STATUSES.filter((terminal) =>
    allowed.includes(terminal),
  );
  // «⋯»: the next step with a note or a chosen handler.
  const detailedNext =
    next?.kind === 'order' &&
    inPipeline &&
    !isViewOnlyOrder(stages, order) &&
    canTransitionOrderStatus(order, next.status) &&
    !blockReason(next.status)
      ? next.status
      : null;
  const cornerActions = terminalTargets.length > 0 || Boolean(detailedNext);

  // Phones: the next step as one chip at the bottom of the dialog.
  const nextReason = next?.kind === 'order' ? stepBlockReason(next.status) : null;
  const mobileNext =
    next && inPipeline && mobileActionSlot && !isViewOnlyOrder(stages, order)
      ? createPortal(
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || Boolean(nextReason)}
              onClick={() => {
                if (next.kind === 'payment') {
                  rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
                }
                applyStep(next);
              }}
              className={cn(
                'inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-opacity disabled:opacity-60',
                next.kind === 'order'
                  ? ORDER_STATUS_COLORS[next.status].badge
                  : 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300',
              )}
            >
              {next.kind === 'payment' ? <PaymentIcon className="h-4 w-4 shrink-0" /> : null}
              <span className="truncate">
                {next.kind === 'order' ? `نقل إلى: ${next.label}` : `${next.label} · ${paymentStateLabel}`}
              </span>
              <ChevronLeft className="h-4 w-4 shrink-0" />
            </button>
            {nextReason ? (
              <p className="max-w-[45%] text-[11px] leading-snug text-muted-foreground">{nextReason}</p>
            ) : null}
          </div>,
          mobileActionSlot,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={cn('relative space-y-2 rounded-xl border border-border/80 bg-card', compact ? 'p-2.5' : 'p-3', cornerActions && 'pt-8')}
    >
      {mobileNext}
      {!inPipeline ? (
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              ORDER_STATUS_COLORS[order.status].badge,
            )}
          >
            {ORDER_STATUS_LABELS_AR[order.status]}
          </span>
          الطلب خارج مسار التجهيز — لا انتقال منه.
        </p>
      ) : null}

      <ol className="flex items-start gap-0 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const done = inPipeline && currentIndex > index;
          const active = inPipeline && currentIndex === index;
          const upcoming = !inPipeline || currentIndex < index;
          const isLast = index === steps.length - 1;
          const isPayment = step.kind === 'payment';
          const reason = step.kind === 'order' ? stepBlockReason(step.status) : null;
          const blocked = Boolean(reason);
          const colors = step.kind === 'order' ? ORDER_STATUS_COLORS[step.status] : null;
          const lineColor = colors ? colors.strip : paid ? 'bg-green-500' : 'bg-amber-500';
          // The current order step is no move; the payment step always opens its panel.
          const inert =
            disabled || (active && !isPayment) || (isPayment && !renderPaymentActions && paid);

          const stepButton = (
            <button
              type="button"
              disabled={inert}
              aria-disabled={blocked || undefined}
              aria-current={active ? 'step' : undefined}
              aria-label={step.label}
              title={
                reason ??
                (isPayment
                  ? `${step.label} · ${paymentStateLabel}`
                  : active
                    ? 'الخطوة الحالية'
                    : `نقل إلى: ${step.label}`)
              }
              onClick={() => applyStep(step)}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:h-9 sm:w-9',
                isPayment && !done && !active && 'border-dashed',
                done && (colors ? colors.solid : 'border-green-600 bg-green-600 text-white'),
                active &&
                  (colors
                    ? colors.soft
                    : 'border-amber-500 bg-amber-500/15 text-amber-700 ring-2 ring-amber-500/25 dark:text-amber-300'),
                upcoming && 'border-border bg-background text-muted-foreground hover:border-primary/40',
                active && !isPayment && 'cursor-default',
                blocked && 'cursor-not-allowed opacity-60',
                disabled && 'opacity-60',
              )}
            >
              {done ? (
                <Check className="h-4 w-4" />
              ) : isPayment ? (
                <PaymentIcon className="h-3.5 w-3.5" />
              ) : (
                index + 1
              )}
            </button>
          );

          return (
            // Phones: every step fits the width (no steps hidden off-screen).
            <li key={step.id} className={cn('flex min-w-0 flex-1 items-start', isLast && 'sm:flex-none sm:shrink-0')}>
              <div className="flex w-full min-w-0 flex-col items-center gap-1.5">
                <div className="flex w-full items-center">
                  {index > 0 ? (
                    <div
                      className={cn('h-0.5 flex-1 rounded-full', done || active ? lineColor : 'bg-border')}
                      aria-hidden
                    />
                  ) : (
                    <div className="flex-1" aria-hidden />
                  )}
                  {isPayment && renderPaymentActions ? (
                    <Popover open={paymentOpen} onOpenChange={setPaymentOpen}>
                      <PopoverAnchor asChild>{stepButton}</PopoverAnchor>
                      <PopoverContent align="center" className="w-72 max-w-[calc(100vw-2rem)] space-y-3 p-3">
                        <div className="space-y-1">
                          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                            {PAYMENT_METHOD_LABELS_AR[paymentMethod]}
                          </p>
                          {account?.nameAr ? (
                            <p className="text-xs text-muted-foreground">
                              {account.nameAr}
                              {account.mobile ? ` · ${account.mobile}` : ''}
                            </p>
                          ) : null}
                          <p
                            className={cn(
                              'text-xs font-semibold',
                              paid ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300',
                            )}
                          >
                            {paymentStateLabel}
                          </p>
                        </div>
                        {renderPaymentActions(() => setPaymentOpen(false))}
                      </PopoverContent>
                    </Popover>
                  ) : (
                    stepButton
                  )}
                  {!isLast ? (
                    <div
                      className={cn('h-0.5 flex-1 rounded-full', done ? lineColor : 'bg-border')}
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
                      ? colors
                        ? colors.text
                        : 'text-amber-700 dark:text-amber-300'
                      : done
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                {isPayment ? (
                  <span className="flex max-w-full flex-col items-center text-center text-[10px] leading-tight sm:max-w-[5.5rem] sm:text-[11px]">
                    <span
                      className={cn(
                        'font-semibold',
                        paid ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300',
                      )}
                    >
                      {paymentStateLabel}
                    </span>
                    {account?.nameAr ? (
                      <span className="max-w-full truncate text-muted-foreground max-sm:hidden">
                        {account.nameAr}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {hint ? (
        <p role="status" className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {cornerActions ? (
        // Top corner of the box, not a row of its own.
        <div className="absolute end-2 top-1.5 flex items-center gap-1">
          {terminalTargets.map((terminal) => (
            <Button
              key={terminal}
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
              disabled={disabled || Boolean(blockReason(terminal))}
              title={blockReason(terminal) ?? undefined}
              onClick={() => requestTransition(terminal)}
            >
              {terminal === 'cancelled' ? 'إلغاء الطلب' : 'استرداد الطلب'}
            </Button>
          ))}
          {detailedNext ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground"
                  disabled={disabled}
                  aria-label="خيارات النقل"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => requestTransition(detailedNext, true)}>
                  <NotebookPen className="h-4 w-4" />
                  {`نقل إلى «${ORDER_STATUS_LABELS_AR[detailedNext]}» مع ملاحظة أو اختيار المسؤول…`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ) : null}

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
