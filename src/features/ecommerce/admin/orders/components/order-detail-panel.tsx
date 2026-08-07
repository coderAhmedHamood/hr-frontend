'use client';

import * as React from 'react';
import { Banknote, CreditCard, Phone, Truck, User } from 'lucide-react';
import { OrderLineShipPanel } from '@/features/ecommerce/admin/orders/components/order-line-ship-panel';
import { OrderPaymentProofThumb } from '@/features/ecommerce/admin/orders/components/order-payment-proof-thumb';
import { OrderStatusHistoryButton } from '@/features/ecommerce/admin/orders/components/order-status-history-button';
import { OrderStatusStepper } from '@/features/ecommerce/admin/orders/components/order-status-stepper';
import {
  useUpdateOrderPaymentStatus,
  useUpdateOrderStatus,
} from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import {
  getOrderPrepGuidance,
  isPaymentSettled,
  PAYMENT_METHOD_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
  resolveOrderPaymentMethod,
} from '@/features/ecommerce/domain/constants/order-status';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

const PAYMENT_STATUS_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  paid: 'success',
  failed: 'destructive',
  refunded: 'outline',
};

type FulfilmentState = 'fulfilled' | 'partial' | 'unfulfilled';

const FULFILMENT_LABELS: Record<FulfilmentState, string> = {
  fulfilled: 'تم التجهيز',
  partial: 'تجهيز جزئي',
  unfulfilled: 'لم يُجهز',
};

const FULFILMENT_VARIANT: Record<FulfilmentState, NonNullable<BadgeProps['variant']>> = {
  fulfilled: 'success',
  partial: 'warning',
  unfulfilled: 'outline',
};

function orderFulfilmentState(order: Order): FulfilmentState {
  if (order.items.length === 0) return 'unfulfilled';
  const shippedCount = order.items.filter((line) => line.shipStatus === 'shipped').length;
  if (shippedCount === order.items.length) return 'fulfilled';
  if (shippedCount === 0) return 'unfulfilled';
  return 'partial';
}

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('ar-YE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

const ITEMS_PAGE_SIZE = 8;

function OrderItemsPanel({ order, companyId }: { order: Order; companyId: string }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'shipped'>('all');
  const [visibleCount, setVisibleCount] = React.useState(ITEMS_PAGE_SIZE);

  const preparedCount = order.items.filter((line) => line.shipStatus === 'shipped').length;
  const pendingCount = order.items.length - preparedCount;
  const manyItems = order.items.length > ITEMS_PAGE_SIZE;

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = order.items.filter((line) => {
    const matchesSearch =
      !normalizedSearch || line.productNameAr.toLowerCase().includes(normalizedSearch);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'shipped' ? line.shipStatus === 'shipped' : line.shipStatus !== 'shipped');
    return matchesSearch && matchesStatus;
  });

  const visibleItems = filteredItems.slice(0, visibleCount);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-sm font-semibold text-foreground">منتجات الطلب</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="success" className="tabular-nums">
              {preparedCount} مجهّز
            </Badge>
            <Badge variant={pendingCount > 0 ? 'warning' : 'outline'} className="tabular-nums">
              {pendingCount} لم يُجهَّز
            </Badge>
            <span className="text-xs text-muted-foreground">من {order.items.length}</span>
          </div>
        </div>
        {order.items.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { value: 'all', label: 'الكل' },
                { value: 'pending', label: 'لم يُجهَّز' },
                { value: 'shipped', label: 'مجهّز' },
              ] as const
            ).map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setStatusFilter(pill.value)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter === pill.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {manyItems ? (
        <EntityFilterSearchField
          value={search}
          onChange={(value) => {
            setSearch(value);
            setVisibleCount(ITEMS_PAGE_SIZE);
          }}
          placeholder="بحث عن منتج في هذا الطلب…"
          className="mb-3 max-w-sm sm:max-w-sm"
        />
      ) : null}

      <div className="space-y-2">
        {visibleItems.map((line, index) => (
          <OrderLineShipPanel
            key={`${order.id}-${line.productId}-${index}-ship`}
            companyId={companyId}
            orderId={order.id}
            line={line}
          />
        ))}
        {filteredItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            لا توجد منتجات مطابقة.
          </p>
        ) : null}
      </div>

      {filteredItems.length > visibleItems.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + ITEMS_PAGE_SIZE)}
          className="mt-3 w-full rounded-xl border border-dashed border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          عرض المزيد ({filteredItems.length - visibleItems.length} متبقٍ)
        </button>
      ) : null}
    </div>
  );
}

type OrderDetailPanelProps = {
  order: Order | null;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, dialog shows a loading shell while order detail is fetched. */
  loading?: boolean;
};

export function OrderDetailPanel({
  order,
  companyId,
  open,
  onOpenChange,
  loading = false,
}: OrderDetailPanelProps) {
  const updateStatus = useUpdateOrderStatus(companyId);
  const updatePayment = useUpdateOrderPaymentStatus(companyId);
  const flowBusy = updateStatus.isPending || updatePayment.isPending;
  const prep = order ? getOrderPrepGuidance(order) : null;
  const paymentMethod = order ? resolveOrderPaymentMethod(order) : null;
  const isCard = paymentMethod === 'card';
  const hasProof = Boolean(
    order?.paymentProofUrls?.some((url) => url?.trim()) || order?.paymentProofUrl?.trim(),
  );
  const phone = order?.phone?.trim() || null;
  const telHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null;
  const shipLine = order
    ? [order.city, order.shippingDistrict ?? order.region].filter(Boolean).join(' — ')
    : '';
  const needsPaymentConfirm = Boolean(order && !isPaymentSettled(order));
  const fulfilment = order ? orderFulfilmentState(order) : null;
  const PaymentIcon = isCard ? CreditCard : Banknote;

  async function markPaid() {
    if (!order) return;
    await updatePayment.mutateAsync({ orderId: order.id, paymentStatus: 'paid' });
  }

  async function advanceStatus(nextStatus: OrderStatus) {
    if (!order || order.status === nextStatus) return;
    await updateStatus.mutateAsync({ orderId: order.id, status: nextStatus });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-3xl sm:max-w-3xl')}>
        <div className={dialogShellHeaderClass}>
          {loading && !order ? (
            <>
              <DialogTitle>تفاصيل الطلب</DialogTitle>
              <DialogDescription>جاري التحميل…</DialogDescription>
            </>
          ) : null}
          {order && prep && paymentMethod ? (
            <div className="space-y-3 pe-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <DialogTitle className="tracking-tight" dir="ltr">
                      {order.orderNumber}
                    </DialogTitle>
                    <OrderStatusHistoryButton
                      companyId={companyId}
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                      history={order.statusHistory}
                    />
                  </div>
                  <DialogDescription className="mt-0.5">
                    {formatDateTime(order.createdAt)}
                    {order.source === 'storefront' || order.orderNumber.startsWith('ND-')
                      ? ' · المتجر'
                      : null}
                  </DialogDescription>
                </div>
                <div className="text-end">
                  <p className="text-[11px] text-muted-foreground">الإجمالي</p>
                  <p className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/25 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {order.customerNameAr}
                  </p>
                  {telHref && phone ? (
                    <a
                      href={telHref}
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold tabular-nums text-primary hover:bg-primary/15"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {phone}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">لا يوجد جوال</span>
                  )}
                  {shipLine ? (
                    <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <Truck className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {shipLine}
                        {order.shippingStreet ? ` · ${order.shippingStreet}` : ''}
                      </span>
                    </span>
                  ) : null}
                </div>
                {order.shippingNotes ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">ملاحظة: {order.shippingNotes}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                    isCard
                      ? 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-200'
                      : 'border-teal-500/30 bg-teal-500/10 text-teal-900 dark:text-teal-200',
                  )}
                >
                  <PaymentIcon className="h-3.5 w-3.5" />
                  {PAYMENT_METHOD_LABELS_AR[paymentMethod]}
                </span>
                <Badge variant={PAYMENT_STATUS_VARIANT[order.paymentStatus ?? 'pending']}>
                  {PAYMENT_STATUS_LABELS_AR[order.paymentStatus ?? 'pending']}
                </Badge>
                {fulfilment ? (
                  <Badge variant={FULFILMENT_VARIANT[fulfilment]}>{FULFILMENT_LABELS[fulfilment]}</Badge>
                ) : null}
                <span
                  className={cn(
                    'text-xs font-medium',
                    prep.canPrepare
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-amber-700 dark:text-amber-400',
                  )}
                >
                  {prep.prepLabel}
                </span>
                {hasProof ? (
                  <OrderPaymentProofThumb
                    urls={order.paymentProofUrls}
                    url={order.paymentProofUrl}
                    orderNumber={order.orderNumber}
                    size="sm"
                    className="ms-auto"
                  />
                ) : null}
                {needsPaymentConfirm ? (
                  <Button
                    type="button"
                    size="sm"
                    className={cn(!hasProof && 'ms-auto')}
                    disabled={flowBusy}
                    onClick={() => void markPaid()}
                  >
                    تأكيد التحصيل
                  </Button>
                ) : null}
              </div>
            </div>
          ) : !loading ? (
            <>
              <DialogTitle>{order?.orderNumber}</DialogTitle>
              {order ? <DialogDescription>{formatDateTime(order.createdAt)}</DialogDescription> : null}
            </>
          ) : null}
        </div>

        <div className={dialogShellBodyClass}>
          {loading && !order ? (
            <p className="py-8 text-center text-sm text-muted-foreground">جاري تحميل تفاصيل الطلب…</p>
          ) : null}
          {order && prep && paymentMethod ? (
            <div className="space-y-4">
              <OrderStatusStepper
                order={order}
                hidePaymentConfirm
                disabled={flowBusy}
                onOrderStatusChange={(nextStatus) => {
                  void advanceStatus(nextStatus);
                }}
                onPaymentPaid={() => {
                  void markPaid();
                }}
              />

              <section className="rounded-2xl border border-border bg-card p-4">
                <OrderItemsPanel order={order} companyId={companyId} />
              </section>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
