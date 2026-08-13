'use client';

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
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {ORDER_KANBAN_STATUSES.map((status) => {
        const column = orders.filter((order) => order.status === status);
        const next = nextOrderPipelineStatus(status);

        return (
          <div
            key={status}
            className="flex w-[min(100%,18.5rem)] shrink-0 flex-col rounded-2xl border border-border bg-muted/20"
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
