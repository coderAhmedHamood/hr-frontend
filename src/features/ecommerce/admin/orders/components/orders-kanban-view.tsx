'use client';

import * as React from 'react';
import { Banknote, CreditCard, Loader2, MapPin, RotateCcw } from 'lucide-react';
import { WhatsappPhoneAction } from '@/features/ecommerce/admin/cms/whatsapp/components/whatsapp-phone-action';
import type { Order, OrderListQuery, OrderStatus } from '@/features/ecommerce/domain/types/order';
import {
  ORDER_KANBAN_STATUSES,
  ORDER_STATUS_LABELS_AR,
  canTransitionOrderStatus,
  getOrderFlowNextStep,
  getOrderPrepGuidance,
  isPaymentSettled,
  nextOrderPipelineStatus,
} from '@/features/ecommerce/domain/constants/order-status';
import {
  OrderMoveDialog,
  type OrderStatusChangeExtra,
} from '@/features/ecommerce/admin/orders/components/order-move-dialog';
import { OrderPaymentProofThumb } from '@/features/ecommerce/admin/orders/components/order-payment-proof-thumb';
import { OrderStatusHistoryButton } from '@/features/ecommerce/admin/orders/components/order-status-history-button';
import { useOrdersStageColumn } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import { moveBlockReason } from '@/features/ecommerce/admin/orders/lib/order-stage-access';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import { usePhoneLayout } from '@/shared/hooks/use-media-query';

/** The list filters every column applies (each column adds its status). */
export type OrdersKanbanFilters = Omit<OrderListQuery, 'page' | 'limit' | 'status'>;

type Props = {
  companyId: string;
  filters: OrdersKanbanFilters;
  /** Order stages: what the user may do (null: unknown, the backend decides). */
  stages?: OrderStagesContext | null;
  onOpen: (order: Order) => void;
  onStatusChange?: (
    order: Order,
    status: OrderStatus,
    note: string | null,
    extra: OrderStatusChangeExtra,
  ) => void;
  onMarkPaid?: (order: Order) => void;
  updatingOrderId?: string | null;
};

type CardActions = Pick<Props, 'companyId' | 'stages' | 'onOpen' | 'onMarkPaid' | 'updatingOrderId'> & {
  onMove?: (order: Order, status: OrderStatus) => void;
};

/**
 * Orders by stage. Each column loads its first orders, then the next ones
 * when its last card scrolls into view (that column only).
 */
export function OrdersKanbanView({ companyId, filters, stages = null, onStatusChange, ...rest }: Props) {
  const phoneLayout = usePhoneLayout();
  const [totals, setTotals] = React.useState<Partial<Record<OrderStatus, number>>>({});
  const reportTotal = React.useCallback((status: OrderStatus, total: number) => {
    setTotals((old) => (old[status] === total ? old : { ...old, [status]: total }));
  }, []);
  const [moving, setMoving] = React.useState<{ order: Order; status: OrderStatus } | null>(null);
  // Phones show one stage at a time (the first with orders until one is picked).
  const [pickedStage, setPickedStage] = React.useState<OrderStatus | null>(null);
  const stage =
    pickedStage ??
    ORDER_KANBAN_STATUSES.find((status) => (totals[status] ?? 0) > 0) ??
    ORDER_KANBAN_STATUSES[0]!;

  const actions: CardActions = {
    companyId,
    stages,
    ...rest,
    onMove: onStatusChange ? (order, status) => setMoving({ order, status }) : undefined,
  };

  const dialog = moving ? (
    <OrderMoveDialog
      order={moving.order}
      companyId={companyId}
      stages={stages}
      target={moving.status}
      onCancel={() => setMoving(null)}
      onConfirm={(status, note, extra) => {
        onStatusChange?.(moving.order, status, note, extra);
        setMoving(null);
      }}
    />
  ) : null;

  if (phoneLayout) {
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
                  {totals[status] ?? '…'}
                </span>
              </button>
            );
          })}
        </div>
        {/* Every column stays mounted (for the tab counts); only the picked one shows. */}
        {ORDER_KANBAN_STATUSES.map((status) => (
          <div key={status} role="tabpanel" hidden={status !== stage}>
            <StageColumn
              status={status}
              filters={{ ...filters, companyId }}
              actions={actions}
              onTotal={reportTotal}
              phone
            />
          </div>
        ))}
        {dialog}
      </div>
    );
  }

  return (
    <div className="sto-kanban">
      {ORDER_KANBAN_STATUSES.map((status) => (
        <div key={status} className="sto-kanban-col rounded-2xl border border-border bg-muted/20">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <h3 className="text-sm font-semibold text-foreground">{ORDER_STATUS_LABELS_AR[status]}</h3>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {totals[status] ?? '…'}
            </span>
          </div>
          <StageColumn
            status={status}
            filters={{ ...filters, companyId }}
            actions={actions}
            onTotal={reportTotal}
          />
        </div>
      ))}
      {dialog}
    </div>
  );
}

function StageColumn({
  status,
  filters,
  actions,
  onTotal,
  phone = false,
}: {
  status: OrderStatus;
  filters: OrdersKanbanFilters;
  actions: CardActions;
  onTotal: (status: OrderStatus, total: number) => void;
  phone?: boolean;
}) {
  const column = useOrdersStageColumn({ ...filters, status });
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = column;
  const total = column.data?.pages[0]?.pagination.total;
  React.useEffect(() => {
    if (total !== undefined) onTotal(status, total);
  }, [onTotal, status, total]);

  // Offset pages can repeat an order that moved between two loads.
  const orders = React.useMemo(() => {
    const seen = new Set<string>();
    return (column.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((order) => order.status === status && !seen.has(order.id) && seen.add(order.id));
  }, [column.data, status]);

  const sentinel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    // The default root clips by the scrolling column too, so it fires at its last card.
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const next = nextOrderPipelineStatus(status);

  return (
    <div className={phone ? 'flex flex-col gap-2.5' : 'sto-kanban-list'}>
      {orders.map((order) => (
        <KanbanCard key={order.id} order={order} next={next} {...actions} />
      ))}

      {column.isLoading ? (
        <p className="flex items-center justify-center gap-1.5 py-10 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جاري التحميل…
        </p>
      ) : column.isError && !orders.length ? (
        <div className="space-y-2 py-8 text-center">
          <p className="text-xs text-destructive">تعذر تحميل طلبات «{ORDER_STATUS_LABELS_AR[status]}».</p>
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => void column.refetch()}>
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة المحاولة
          </Button>
        </div>
      ) : !orders.length ? (
        <p
          className={cn(
            'py-10 text-center text-xs text-muted-foreground',
            phone && 'rounded-2xl border border-dashed border-border',
          )}
        >
          {phone ? `لا طلبات في «${ORDER_STATUS_LABELS_AR[status]}»` : 'لا طلبات'}
        </p>
      ) : null}

      {hasNextPage ? (
        <div ref={sentinel} className="py-1">
          {/* Also a button: scrolling may not reach it (short screens, keyboard). */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-10 w-full gap-1.5 text-xs text-muted-foreground"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isFetchingNextPage
              ? 'جاري التحميل…'
              : `عرض المزيد (${Math.max(0, (total ?? 0) - orders.length)} متبقٍ)`}
          </Button>
        </div>
      ) : null}
      {column.isFetchNextPageError ? (
        <p className="text-center text-xs text-destructive">تعذر تحميل المزيد — اضغط «عرض المزيد» للمحاولة.</p>
      ) : null}
    </div>
  );
}

function KanbanCard({
  order,
  next,
  companyId,
  stages,
  onOpen,
  onMove,
  onMarkPaid,
  updatingOrderId,
}: CardActions & { order: Order; next: OrderStatus | null | undefined }) {
  const flowNext = getOrderFlowNextStep(order);
  const prep = getOrderPrepGuidance(order);
  const needsPayment = flowNext?.kind === 'payment' && !isPaymentSettled(order);
  const canMove = Boolean(next) && onMove && !needsPayment && canTransitionOrderStatus(order, next!);
  // The backend decides; this only shows why a move would be refused.
  const moveBlock = canMove ? moveBlockReason(stages, order, next!) : null;
  const isCard = prep.paymentMethod === 'card';
  const PaymentIcon = isCard ? CreditCard : Banknote;
  const phone = order.phone?.trim() || null;

  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-card p-3 shadow-soft',
        'border-s-[3px] transition-shadow hover:shadow-elevated',
        isCard ? 'border-s-sky-600 hover:border-sky-600/50' : 'border-s-teal-600 hover:border-teal-600/50',
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

        <p
          className={cn(
            'mt-1 truncate text-xs font-medium',
            order.assignedUserId ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {order.assignedUserId
            ? `المسؤول: ${order.assignedUserName ?? 'مستخدم'}${
                stages && order.assignedUserId === stages.userId ? ' (أنت)' : ''
              }`
            : 'غير مسند'}
        </p>

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
            className="w-full max-sm:h-10"
            disabled={updatingOrderId === order.id}
            onClick={() => onMarkPaid(order)}
          >
            تأكيد التحصيل
          </Button>
        ) : null}

        {canMove ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full max-sm:h-10"
              disabled={updatingOrderId === order.id || Boolean(moveBlock)}
              title={moveBlock ?? undefined}
              onClick={() => onMove?.(order, next!)}
            >
              نقل إلى: {ORDER_STATUS_LABELS_AR[next!]}
            </Button>
            {moveBlock ? <p className="text-[11px] leading-snug text-muted-foreground">{moveBlock}</p> : null}
          </>
        ) : null}
      </div>
    </article>
  );
}
