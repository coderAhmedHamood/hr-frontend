'use client';

import * as React from 'react';
import { Banknote, CreditCard, MapPin } from 'lucide-react';
import { WhatsappPhoneAction } from '@/features/ecommerce/admin/cms/whatsapp/components/whatsapp-phone-action';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_KANBAN_STATUSES,
  ORDER_STATUS_LABELS_AR,
  canTransitionOrderStatus,
  getOrderFlowNextStep,
  getOrderPrepGuidance,
  isPaymentSettled,
  nextOrderPipelineStatus,
} from '@/features/ecommerce/domain/constants/order-status';
import { OrderPaymentProofThumb } from '@/features/ecommerce/admin/orders/components/order-payment-proof-thumb';
import { OrderStatusHistoryButton } from '@/features/ecommerce/admin/orders/components/order-status-history-button';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import { usePhoneLayout } from '@/shared/hooks/use-media-query';

type Props = {
  companyId: string;
  orders: Order[];
  onOpen: (order: Order) => void;
  onStatusChange?: (order: Order, status: OrderStatus) => void;
  onMarkPaid?: (order: Order) => void;
  updatingOrderId?: string | null;
};

export function OrdersKanbanView({
  companyId,
  orders,
  onOpen,
  onStatusChange,
  onMarkPaid,
  updatingOrderId,
}: Props) {
  const phoneLayout = usePhoneLayout();
  const counts = React.useMemo(() => {
    const byStatus = new Map<OrderStatus, number>();
    for (const order of orders) byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
    return byStatus;
  }, [orders]);
  // Phones show one stage at a time (the first with orders until one is picked).
  const [pickedStage, setPickedStage] = React.useState<OrderStatus | null>(null);
  const stage =
    pickedStage ?? ORDER_KANBAN_STATUSES.find((status) => (counts.get(status) ?? 0) > 0) ?? ORDER_KANBAN_STATUSES[0]!;

  function renderCard(order: Order, next: OrderStatus | null | undefined) {
    const flowNext = getOrderFlowNextStep(order);
    const prep = getOrderPrepGuidance(order);
    const needsPayment = flowNext?.kind === 'payment' && !isPaymentSettled(order);
    const canMove =
      Boolean(next) &&
      onStatusChange &&
      !needsPayment &&
      canTransitionOrderStatus(order, next!);
    const isCard = prep.paymentMethod === 'card';
    const PaymentIcon = isCard ? CreditCard : Banknote;
    const phone = order.phone?.trim() || null;

    return (
      <article
        key={order.id}
        className={cn(
          'rounded-xl border border-border bg-card p-3 shadow-soft',
          'border-s-[3px] transition-shadow hover:shadow-elevated',
          isCard
            ? 'border-s-sky-600 hover:border-sky-600/50'
            : 'border-s-teal-600 hover:border-teal-600/50',
          !prep.canPrepare && 'border-amber-500/45',
          isCard && !prep.canPrepare && 'bg-sky-500/[0.04]',
          !isCard && 'bg-teal-500/[0.03]',
        )}
      >
        <div
          role="button"
          tabIndex={0}
          className="w-full cursor-pointer text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onOpen(order)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen(order);
            }
          }}
        >
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-0.5">
              <span className="font-semibold tracking-tight" dir="ltr">
                {order.orderNumber}
              </span>
              <OrderStatusHistoryButton
                companyId={companyId}
                orderId={order.id}
                orderNumber={order.orderNumber}
                history={order.statusHistory}
                className="h-7 w-7 shrink-0"
              />
            </div>
            <Badge variant="subtle" className="shrink-0 tabular-nums">
              {formatPrice(order.totalAmount)}
            </Badge>
          </div>
          <p className="truncate text-sm font-medium text-foreground">{order.customerNameAr}</p>

          {phone ? (
            <WhatsappPhoneAction
              phone={phone}
              customerName={order.customerNameAr}
              orderId={order.id}
              className="mt-1.5 max-w-full rounded-md bg-foreground/[0.04] px-1.5 py-1 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary"
            />
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">لا يوجد رقم جوال</p>
          )}

          {order.city || order.region ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[order.city, order.region].filter(Boolean).join(' — ')}
            </p>
          ) : null}

          {order.assignedUserId ? (
            <p className="mt-1 truncate text-xs font-medium text-primary">
              المسؤول: {order.assignedUserName ?? 'مستخدم'}
            </p>
          ) : null}

          <div
            className={cn(
              'mt-2 rounded-lg border px-2 py-1.5',
              prep.canPrepare
                ? isCard
                  ? 'border-sky-500/30 bg-sky-500/10'
                  : 'border-teal-500/30 bg-teal-500/10'
                : 'border-amber-500/30 bg-amber-500/10',
            )}
          >
            <p
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] font-semibold',
                prep.canPrepare
                  ? isCard
                    ? 'text-sky-900 dark:text-sky-300'
                    : 'text-teal-900 dark:text-teal-300'
                  : 'text-amber-800 dark:text-amber-300',
              )}
            >
              <PaymentIcon className="h-3.5 w-3.5 shrink-0" />
              {prep.methodLabel}
            </p>
            <p
              className={cn(
                'mt-0.5 text-[11px] leading-snug',
                prep.canPrepare
                  ? isCard
                    ? 'text-sky-800/90 dark:text-sky-400/90'
                    : 'text-teal-800/90 dark:text-teal-400/90'
                  : 'text-amber-700/90 dark:text-amber-400/90',
              )}
            >
              {prep.prepLabel}
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          {order.paymentProofUrls?.length || order.paymentProofUrl ? (
            <div className="flex justify-end">
              <OrderPaymentProofThumb
                urls={order.paymentProofUrls}
                url={order.paymentProofUrl}
                orderNumber={order.orderNumber}
                size="sm"
              />
            </div>
          ) : null}

          {needsPayment && onMarkPaid ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={updatingOrderId === order.id}
              onClick={() => onMarkPaid(order)}
            >
              تأكيد التحصيل
            </Button>
          ) : null}

          {canMove ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              disabled={updatingOrderId === order.id}
              onClick={() => onStatusChange?.(order, next!)}
            >
              نقل إلى: {ORDER_STATUS_LABELS_AR[next!]}
            </Button>
          ) : null}
        </div>
      </article>
    );
  }

  if (phoneLayout) {
    const column = orders.filter((order) => order.status === stage);
    const next = nextOrderPipelineStatus(stage);
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="مراحل الطلبات">
          {ORDER_KANBAN_STATUSES.map((status) => {
            const active = status === stage;
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPickedStage(status)}
                className={cn(
                  'flex min-h-11 items-center justify-between gap-1 rounded-xl border px-2.5 py-1.5 text-start text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground',
                )}
              >
                <span className="min-w-0 truncate">{ORDER_STATUS_LABELS_AR[status]}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-1.5 text-[11px] tabular-nums',
                    active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {counts.get(status) ?? 0}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2.5" role="tabpanel">
          {column.map((order) => renderCard(order, next))}
          {!column.length ? (
            <p className="rounded-2xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
              لا طلبات في «{ORDER_STATUS_LABELS_AR[stage]}»
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="sto-kanban">
      {ORDER_KANBAN_STATUSES.map((status) => {
        const column = orders.filter((order) => order.status === status);
        const next = nextOrderPipelineStatus(status);

        return (
          <div
            key={status}
            className="sto-kanban-col rounded-2xl border border-border bg-muted/20"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">{ORDER_STATUS_LABELS_AR[status]}</h3>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {column.length}
              </span>
            </div>

            <div className="sto-kanban-list">
              {column.map((order) => renderCard(order, next))}

              {!column.length ? (
                <p className="py-10 text-center text-xs text-muted-foreground">لا طلبات</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
