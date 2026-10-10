'use client';

import * as React from 'react';
import { Banknote, CreditCard, Truck, User } from 'lucide-react';
import { WhatsappPhoneAction } from '@/features/ecommerce/admin/cms/whatsapp/components/whatsapp-phone-action';
import { OrderAttachmentsPanel } from '@/features/ecommerce/admin/orders/components/order-attachments-panel';
import { OrderStaffNotePanel } from '@/features/ecommerce/admin/orders/components/order-staff-note-panel';
import { OrderStockPanel } from '@/features/ecommerce/admin/orders/components/order-stock-panel';
import { OrderLineShipPanel } from '@/features/ecommerce/admin/orders/components/order-line-ship-panel';
import { OrderPaymentProofThumb } from '@/features/ecommerce/admin/orders/components/order-payment-proof-thumb';
import { OrderStatusHistoryButton } from '@/features/ecommerce/admin/orders/components/order-status-history-button';
import {
  OrderStatusStepper,
  type OrderStatusChangeExtra,
} from '@/features/ecommerce/admin/orders/components/order-status-stepper';
import { OrderAssignmentPanel } from '@/features/ecommerce/admin/orders/components/order-assignment-panel';
import { OrderDeliveryPanel } from '@/features/ecommerce/admin/orders/components/order-delivery-panel';
import { useOrderStagesContext } from '@/features/ecommerce/admin/orders/hooks/use-order-stages';
import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import { moveBlockReason } from '@/features/ecommerce/admin/orders/lib/order-stage-access';
import {
  useOrderDetail,
  useUpdateOrderPaymentStatus,
  useUpdateOrderStatus,
} from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import {
  getOrderPrepGuidance,
  isPaymentSettled,
  canTransitionOrderStatus,
  ORDER_LINE_SHIP_STATUS_LABELS_AR,
  ORDER_STATUS_LABELS_AR,
  PAYMENT_METHOD_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
  resolveOrderPaymentMethod,
} from '@/features/ecommerce/domain/constants/order-status';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  dialogShellBodyClass,
  dialogMobileFullScreenClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn, formatDisplayDateTime } from '@/shared/utils';

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
  return formatDisplayDateTime(iso);
}

const ITEMS_PAGE_SIZE = 8;

function OrderItemsPanel({
  order,
  companyId,
  stages,
}: {
  order: Order;
  companyId: string;
  stages: OrderStagesContext | null;
}) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'shipped'>('all');
  const [visibleCount, setVisibleCount] = React.useState(ITEMS_PAGE_SIZE);
  const updateStatus = useUpdateOrderStatus(companyId);

  const shippedCount = order.items.filter((line) => line.shipStatus === 'shipped').length;
  const assignedCount = order.items.filter((line) => line.shipStatus === 'assigned').length;
  const partialCount = order.items.filter((line) => line.shipStatus === 'partial').length;
  const unassignedCount = order.items.filter((line) => line.shipStatus === 'unassigned').length;
  const manyItems = order.items.length > ITEMS_PAGE_SIZE;
  const canPromoteOrder =
    canTransitionOrderStatus(order, 'shipped') && !moveBlockReason(stages, order, 'shipped');

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
              {shippedCount} {ORDER_LINE_SHIP_STATUS_LABELS_AR.shipped}
            </Badge>
            {assignedCount > 0 ? (
              <Badge variant="secondary" className="tabular-nums">
                {assignedCount} {ORDER_LINE_SHIP_STATUS_LABELS_AR.assigned}
              </Badge>
            ) : null}
            {partialCount > 0 ? (
              <Badge variant="warning" className="tabular-nums">
                {partialCount} {ORDER_LINE_SHIP_STATUS_LABELS_AR.partial}
              </Badge>
            ) : null}
            {unassignedCount > 0 ? (
              <Badge variant="outline" className="tabular-nums">
                {unassignedCount} {ORDER_LINE_SHIP_STATUS_LABELS_AR.unassigned}
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">من {order.items.length}</span>
          </div>
        </div>
        {order.items.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { value: 'all', label: 'الكل' },
                { value: 'pending', label: 'غير مشحون' },
                { value: 'shipped', label: 'تم الشحن' },
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

      {canPromoteOrder ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2.5">
          <p className="text-sm text-teal-900 dark:text-teal-200">
            كل الأصناف شُحنت — حالة الطلب ما زالت «{ORDER_STATUS_LABELS_AR[order.status]}».
          </p>
          <Button
            type="button"
            size="sm"
            disabled={updateStatus.isPending}
            onClick={() =>
              void updateStatus.mutateAsync({
                orderId: order.id,
                status: 'shipped',
              })
            }
          >
            تحديث الطلب إلى: تم الشحن
          </Button>
        </div>
      ) : null}

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
            orderStatus={order.status}
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
  order?: Order | null;
  /** Used when list row is missing/stale — detail is fetched by id. */
  orderId?: string | null;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, dialog shows a loading shell while order detail is fetched. */
  loading?: boolean;
};

export function OrderDetailPanel({
  order: orderProp = null,
  orderId: orderIdProp = null,
  companyId,
  open,
  onOpenChange,
  loading: loadingProp = false,
}: OrderDetailPanelProps) {
  const orderId = orderIdProp || orderProp?.id || null;
  const detailQuery = useOrderDetail(companyId, open ? orderId : null);
  const order = detailQuery.data ?? orderProp;
  const loading =
    loadingProp || (Boolean(open && orderId) && detailQuery.isLoading && !order);

  const updateStatus = useUpdateOrderStatus(companyId);
  const updatePayment = useUpdateOrderPaymentStatus(companyId);
  const stages = useOrderStagesContext(companyId).data ?? null;
  const flowBusy = updateStatus.isPending || updatePayment.isPending;
  const prep = order ? getOrderPrepGuidance(order) : null;
  const paymentMethod = order ? resolveOrderPaymentMethod(order) : null;
  const isCard = paymentMethod === 'card';
  const hasProof = Boolean(
    order?.paymentProofUrls?.some((url) => url?.trim()) || order?.paymentProofUrl?.trim(),
  );
  const phone = order?.phone?.trim() || null;
  const shipLine = order
    ? [order.city, order.shippingDistrict ?? order.region].filter(Boolean).join(' — ')
    : '';
  const needsPaymentConfirm = Boolean(
    order && !isPaymentSettled(order) && (!stages || stages.canUpdate),
  );
  const fulfilment = order ? orderFulfilmentState(order) : null;
  const PaymentIcon = isCard ? CreditCard : Banknote;

  async function markPaid() {
    if (!order) return;
    await updatePayment.mutateAsync({ orderId: order.id, paymentStatus: 'paid' });
  }

  async function advanceStatus(
    nextStatus: OrderStatus,
    note?: string | null,
    extra?: OrderStatusChangeExtra,
  ) {
    if (!order || order.status === nextStatus) return;
    if (!canTransitionOrderStatus(order, nextStatus)) return;
    await updateStatus.mutateAsync({ orderId: order.id, status: nextStatus, note, ...extra });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          dialogShellContentClass,
          dialogMobileFullScreenClass,
          'max-w-3xl sm:max-w-3xl max-sm:overflow-y-auto',
        )}
      >
        <div className={cn(dialogShellHeaderClass, 'max-sm:px-4 max-sm:py-4')}>
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
                  {order.subtotalAmount && order.shippingFeeAmount ? (
                    <p className="text-[11px] tabular-nums text-muted-foreground">
                      المنتجات {formatPrice(order.subtotalAmount)} · التوصيل{' '}
                      {order.shippingFeeAmount.amount === 0
                        ? 'مجاني'
                        : formatPrice(order.shippingFeeAmount)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/25 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {order.customerNameAr}
                  </p>
                  {phone ? (
                    <WhatsappPhoneAction
                      phone={phone}
                      customerName={order.customerNameAr}
                      orderId={order.id}
                      className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold hover:bg-primary/15"
                    />
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
                {order.customerNote ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    ملاحظة العميل: {order.customerNote}
                  </p>
                ) : null}
                {order.shippingNotes ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    ملاحظة الشحن: {order.shippingNotes}
                  </p>
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
                {order.paymentAccountSnapshot?.nameAr ? (
                  <Badge variant="subtle" className="text-muted-foreground max-sm:hidden">
                    {order.paymentAccountSnapshot.nameAr}
                    {order.paymentAccountSnapshot.mobile
                      ? ` · ${order.paymentAccountSnapshot.mobile}`
                      : ''}
                  </Badge>
                ) : null}
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
                    className={cn(!hasProof && 'ms-auto', 'max-sm:h-11 max-sm:w-full')}
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

        <div
          className={cn(
            dialogShellBodyClass,
            // Phones: one scroll for the whole order; room for the action bar.
            'max-sm:flex-none max-sm:overflow-visible max-sm:px-3 max-sm:pb-28 max-sm:pt-4',
          )}
        >
          {loading && !order ? (
            <p className="py-8 text-center text-sm text-muted-foreground">جاري تحميل تفاصيل الطلب…</p>
          ) : null}
          {order && prep && paymentMethod ? (
            <div className="space-y-4">
              <OrderStatusStepper
                order={order}
                companyId={companyId}
                stages={stages}
                hidePaymentConfirm
                disabled={flowBusy}
                onOrderStatusChange={(nextStatus, note, extra) => {
                  void advanceStatus(nextStatus, note, extra).catch(() => undefined);
                }}
                onPaymentPaid={() => {
                  void markPaid();
                }}
              />

              {/* Tabs keep the order readable: what is needed to handle it
                  first, the rest one tap away. */}
              <Tabs defaultValue="handle" className="space-y-3">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/60 p-1 max-sm:flex-nowrap max-sm:overflow-x-auto">
                  {(
                    [
                      ['handle', 'المعالجة', 0],
                      ['delivery', 'التوصيل والتواصل', 0],
                      ['stock', 'المخزون', 0],
                      ['notes', 'الملاحظات', order.staffNote?.trim() ? 1 : 0],
                      ['attachments', 'المرفقات', order.attachments?.length ?? 0],
                    ] as const
                  ).map(([value, label, count]) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="flex-1 gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm max-sm:flex-none max-sm:py-2"
                    >
                      {label}
                      {count > 0 ? (
                        <span className="rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
                          {count}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="handle" className="mt-0 space-y-4">
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <OrderAssignmentPanel order={order} companyId={companyId} stages={stages} />
                  </section>
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <OrderItemsPanel order={order} companyId={companyId} stages={stages} />
                  </section>
                </TabsContent>

                <TabsContent value="delivery" className="mt-0">
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <OrderDeliveryPanel order={order} companyId={companyId} stages={stages} />
                  </section>
                </TabsContent>

                <TabsContent value="stock" className="mt-0">
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <OrderStockPanel order={order} companyId={companyId} />
                  </section>
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <OrderStaffNotePanel order={order} companyId={companyId} />
                  </section>
                </TabsContent>

                <TabsContent value="attachments" className="mt-0">
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <OrderAttachmentsPanel order={order} companyId={companyId} />
                  </section>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
