'use client';

import { MapPin } from 'lucide-react';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_KANBAN_STATUSES,
  ORDER_STATUS_LABELS_AR,
  PAYMENT_METHOD_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
  canAdvanceOrderStatus,
  getOrderFlowNextStep,
  isPaymentSettled,
  nextOrderPipelineStatus,
} from '@/features/ecommerce/domain/constants/order-status';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

type Props = {
  orders: Order[];
  onOpen: (order: Order) => void;
  onStatusChange?: (order: Order, status: OrderStatus) => void;
  onMarkPaid?: (order: Order) => void;
  updatingOrderId?: string | null;
};

export function OrdersKanbanView({
  orders,
  onOpen,
  onStatusChange,
  onMarkPaid,
  updatingOrderId,
}: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {ORDER_KANBAN_STATUSES.map((status) => {
        const column = orders.filter((order) => order.status === status);
        const next = nextOrderPipelineStatus(status);

        return (
          <div
            key={status}
            className="flex w-[min(100%,17.5rem)] shrink-0 flex-col rounded-2xl border border-border bg-muted/20"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">{ORDER_STATUS_LABELS_AR[status]}</h3>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {column.length}
              </span>
            </div>

            <div className="flex max-h-[min(70vh,36rem)] flex-1 flex-col gap-2 overflow-y-auto p-2">
              {column.map((order) => {
                const flowNext = getOrderFlowNextStep(order);
                const needsPayment = flowNext?.kind === 'payment' && !isPaymentSettled(order);
                const canMove =
                  Boolean(next) &&
                  onStatusChange &&
                  !needsPayment &&
                  canAdvanceOrderStatus(order, next!);

                return (
                  <div
                    key={order.id}
                    className={cn(
                      'rounded-xl border border-border bg-card p-3 shadow-soft',
                      'transition-shadow hover:border-primary/40 hover:shadow-elevated',
                    )}
                  >
                    <button type="button" className="w-full text-start" onClick={() => onOpen(order)}>
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <span className="font-semibold tracking-tight" dir="ltr">
                          {order.orderNumber}
                        </span>
                        <Badge variant="subtle" className="shrink-0 tabular-nums">
                          {formatPrice(order.totalAmount)}
                        </Badge>
                      </div>
                      <p className="truncate text-sm font-medium text-foreground">{order.customerNameAr}</p>
                      {order.city || order.region ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[order.city, order.region].filter(Boolean).join(' — ')}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {order.paymentMethod ? (
                          <Badge variant="outline" className="text-[10px]">
                            {PAYMENT_METHOD_LABELS_AR[order.paymentMethod]}
                          </Badge>
                        ) : null}
                        <Badge
                          variant={isPaymentSettled(order) ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {PAYMENT_STATUS_LABELS_AR[order.paymentStatus ?? 'pending']}
                        </Badge>
                      </div>
                    </button>

                    {needsPayment && onMarkPaid ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="mt-2 w-full"
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
                        className="mt-2 w-full"
                        disabled={updatingOrderId === order.id}
                        onClick={() => onStatusChange?.(order, next!)}
                      >
                        نقل إلى: {ORDER_STATUS_LABELS_AR[next!]}
                      </Button>
                    ) : null}
                  </div>
                );
              })}

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
