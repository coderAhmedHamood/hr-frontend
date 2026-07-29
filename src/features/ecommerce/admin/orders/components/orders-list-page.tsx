'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import * as React from 'react';
import {
  CreditCard,
  Eye,
  Kanban,
  List,
  ListChecks,
  MapPin,
  PackageCheck,
  Phone,
  RotateCcw,
  ShoppingCart,
  Store,
  Truck,
  User,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OrderLineShipPanel } from '@/features/ecommerce/admin/orders/components/order-line-ship-panel';
import { OrderStatusStepper } from '@/features/ecommerce/admin/orders/components/order-status-stepper';
import { OrdersKanbanView } from '@/features/ecommerce/admin/orders/components/orders-kanban-view';
import {
  useOrders,
  useUpdateOrderPaymentStatus,
  useUpdateOrderStatus,
} from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import {
  ORDER_STATUS_LABELS_AR,
  ORDER_TERMINAL_STATUSES,
  PAYMENT_METHOD_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
} from '@/features/ecommerce/domain/constants/order-status';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { StatTile, StatTileGrid } from '@/components/ui/stat-tile';
import { DataTable, AppPagination, type ColumnDef } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
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

type ViewMode = 'list' | 'kanban';

const KANBAN_PAGE_SIZE = 100;

const STATUS_FILTER_OPTIONS: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: 'كل الحالات' },
  ...(Object.keys(ORDER_STATUS_LABELS_AR) as OrderStatus[]).map((value) => ({
    value,
    label: ORDER_STATUS_LABELS_AR[value],
  })),
];

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

function itemCount(order: Order): number {
  return order.items.reduce((sum, line) => sum + line.quantity, 0);
}

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-YE', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
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

  const shippedCount = order.items.filter((line) => line.shipStatus === 'shipped').length;
  const manyItems = order.items.length > ITEMS_PAGE_SIZE;

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = order.items.filter((line) => {
    const matchesSearch = !normalizedSearch || line.productNameAr.toLowerCase().includes(normalizedSearch);
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'shipped' ? line.shipStatus === 'shipped' : line.shipStatus !== 'shipped');
    return matchesSearch && matchesStatus;
  });

  const visibleItems = filteredItems.slice(0, visibleCount);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          منتجات الطلب
          <span className="ms-1.5 font-normal text-muted-foreground">
            ({shippedCount}/{order.items.length} تم شحنها)
          </span>
        </h3>
        {order.items.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { value: 'all', label: 'الكل' },
                { value: 'pending', label: 'لم يُشحن' },
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
        {visibleItems.map((line) => (
          <OrderLineShipPanel
            key={`${order.id}-${line.productId}-ship`}
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

function OrderDetailPanel({
  order,
  companyId,
  open,
  onOpenChange,
}: {
  order: Order | null;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateStatus = useUpdateOrderStatus(companyId);
  const updatePayment = useUpdateOrderPaymentStatus(companyId);
  const locationLabel = order ? [order.city, order.region].filter(Boolean).join(' • ') : '';
  const flowBusy = updateStatus.isPending || updatePayment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-2xl sm:max-w-2xl')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle>{order?.orderNumber}</DialogTitle>
          {order ? <DialogDescription>{formatDateTime(order.createdAt)}</DialogDescription> : null}
        </div>
        <div className={dialogShellBodyClass}>
        {order ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={FULFILMENT_VARIANT[orderFulfilmentState(order)]}>
                {FULFILMENT_LABELS[orderFulfilmentState(order)]}
              </Badge>
              {order.paymentMethod ? (
                <Badge variant="subtle">
                  {PAYMENT_METHOD_LABELS_AR[order.paymentMethod]}
                </Badge>
              ) : null}
              <Badge variant={PAYMENT_STATUS_VARIANT[order.paymentStatus ?? 'pending']}>
                {PAYMENT_STATUS_LABELS_AR[order.paymentStatus ?? 'pending']}
              </Badge>
              {order.source === 'storefront' || order.orderNumber.startsWith('ND-') ? (
                <Badge variant="subtle" className="gap-1">
                  <Store className="h-3 w-3" />
                  المتجر
                </Badge>
              ) : null}
            </div>

            <OrderStatusStepper
              order={order}
              disabled={flowBusy}
              onOrderStatusChange={(nextStatus) => {
                void updateStatus.mutateAsync({
                  orderId: order.id,
                  status: nextStatus,
                });
              }}
              onPaymentPaid={() => {
                void updatePayment.mutateAsync({
                  orderId: order.id,
                  paymentStatus: 'paid',
                });
              }}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border/80 bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  العميل
                </div>
                <p className="font-medium text-foreground">{order.customerNameAr}</p>
                {order.phone ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground" dir="ltr">
                    <Phone className="h-3.5 w-3.5" />
                    {order.phone}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  الشحن
                </div>
                <p className="text-sm text-foreground">
                  {[order.city, order.shippingDistrict ?? order.region].filter(Boolean).join(' — ') || locationLabel || '—'}
                </p>
                {order.shippingStreet ? (
                  <p className="mt-1 text-sm text-muted-foreground">{order.shippingStreet}</p>
                ) : null}
                {order.shippingNotes ? (
                  <p className="mt-2 text-xs text-muted-foreground">ملاحظة: {order.shippingNotes}</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 sm:col-span-2 lg:col-span-1">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5" />
                  الدفع
                </div>
                <p className="font-medium text-foreground">
                  {order.paymentMethod ? PAYMENT_METHOD_LABELS_AR[order.paymentMethod] : '—'}
                </p>
                {order.paymentStatus ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {PAYMENT_STATUS_LABELS_AR[order.paymentStatus]}
                  </p>
                ) : null}
                <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                  {order.subtotalAmount ? (
                    <div className="flex justify-between gap-3 text-muted-foreground">
                      <span>المجموع الفرعي</span>
                      <span className="tabular-nums">{formatPrice(order.subtotalAmount)}</span>
                    </div>
                  ) : null}
                  {order.shippingFeeAmount ? (
                    <div className="flex justify-between gap-3 text-muted-foreground">
                      <span>الشحن</span>
                      <span className="tabular-nums">{formatPrice(order.shippingFeeAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3 font-semibold text-foreground">
                    <span>الإجمالي</span>
                    <span className="tabular-nums">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <OrderItemsPanel order={order} companyId={companyId} />
          </div>
        ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OrdersListPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') as OrderStatus | null) ?? undefined;
  const view: ViewMode = searchParams.get('view') === 'kanban' ? 'kanban' : 'list';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize =
    view === 'kanban'
      ? KANBAN_PAGE_SIZE
      : Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
  const selectedOrderId = searchParams.get('order') ?? '';

  const [searchInput, setSearchInput] = React.useState(search);

  function updateParams(next: {
    q?: string;
    status?: string;
    view?: ViewMode;
    page?: number;
    pageSize?: number;
    order?: string | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q);
      else params.delete('q');
    }
    if (next.status !== undefined) {
      if (next.status) params.set('status', next.status);
      else params.delete('status');
    }
    if (next.view !== undefined) {
      if (next.view === 'kanban') params.set('view', 'kanban');
      else params.delete('view');
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
    }
    if (next.pageSize !== undefined) {
      if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(next.pageSize));
      else params.delete('pageSize');
    }
    if (next.order !== undefined) {
      if (next.order) params.set('order', next.order);
      else params.delete('order');
    }
    params.delete('tab');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const searchRef = React.useRef(search);
  const updateParamsRef = React.useRef(updateParams);
  searchRef.current = search;
  updateParamsRef.current = updateParams;

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() !== searchRef.current) {
        updateParamsRef.current({ q: searchInput.trim(), page: 1 });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useOrders({
    companyId,
    search: search || undefined,
    status: view === 'kanban' ? undefined : status,
    page: view === 'kanban' ? 1 : page,
    limit: pageSize,
  });

  const updateStatus = useUpdateOrderStatus(companyId);
  const updatePayment = useUpdateOrderPaymentStatus(companyId);

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'ecommerce-admin-live-orders' || event.key === null) {
        void refetch();
      }
    };
    window.addEventListener('storage', onStorage);
    const onFocus = () => void refetch();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [refetch]);

  const items = data?.items ?? [];
  const selectedOrder = items.find((order) => order.id === selectedOrderId) ?? null;

  const total = data?.pagination.total ?? 0;
  const unfulfilledCount = items.filter((order) => orderFulfilmentState(order) !== 'fulfilled').length;
  const returnedCount = items.filter((order) => ORDER_TERMINAL_STATUSES.includes(order.status)).length;
  const fulfilledCount = items.filter((order) => orderFulfilmentState(order) === 'fulfilled').length;

  const viewButtons: { mode: ViewMode; icon: typeof List; label: string }[] = [
    { mode: 'list', icon: List, label: 'قائمة' },
    { mode: 'kanban', icon: Kanban, label: 'كانبان' },
  ];

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <div className="flex rounded-lg border border-border p-0.5">
          {viewButtons.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant="ghost"
              className={cn('h-7 gap-1.5 px-2', view === mode && 'bg-muted')}
              onClick={() => updateParams({ view: mode, page: 1, status: mode === 'kanban' ? '' : status ?? '' })}
              aria-label={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    ),
    [view, status],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={
          <EntityFilterSearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="بحث برقم الطلب أو اسم العميل أو الهاتف…"
          />
        }
        moreFilters={
          view === 'kanban'
            ? []
            : [
                {
                  id: 'status',
                  value: status ?? 'all',
                  onChange: (value) => updateParams({ status: value === 'all' ? '' : value, page: 1 }),
                  placeholder: 'كل الحالات',
                  options: STATUS_FILTER_OPTIONS.map((option) => ({
                    value: option.value === '' ? 'all' : option.value,
                    label: option.label,
                  })),
                },
              ]
        }
      />
    ),
    [searchInput, status, view],
  );

  const columns: ColumnDef<Order>[] = [
    {
      key: 'order',
      title: 'الطلب',
      render: (order) => (
        <span className="font-semibold tracking-tight text-foreground" dir="ltr">
          {order.orderNumber}
        </span>
      ),
    },
    {
      key: 'date',
      title: 'التاريخ',
      render: (order) => <span className="text-sm text-muted-foreground">{formatShortDate(order.createdAt)}</span>,
    },
    {
      key: 'customer',
      title: 'العميل',
      render: (order) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{order.customerNameAr}</span>
          {order.city ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {order.city}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (order) => (
        <Badge variant={ORDER_TERMINAL_STATUSES.includes(order.status) ? 'destructive' : 'subtle'}>
          {ORDER_STATUS_LABELS_AR[order.status]}
        </Badge>
      ),
    },
    {
      key: 'payment',
      title: 'الدفع',
      render: (order) => (
        <div className="flex flex-col gap-1">
          {order.paymentMethod ? (
            <span className="text-xs text-muted-foreground">
              {PAYMENT_METHOD_LABELS_AR[order.paymentMethod]}
            </span>
          ) : null}
          <Badge variant={PAYMENT_STATUS_VARIANT[order.paymentStatus ?? 'pending']}>
            {PAYMENT_STATUS_LABELS_AR[order.paymentStatus ?? 'pending']}
          </Badge>
        </div>
      ),
    },
    {
      key: 'total',
      title: 'الإجمالي',
      render: (order) => <span className="font-semibold tabular-nums text-foreground">{formatPrice(order.totalAmount)}</span>,
    },
    {
      key: 'delivery',
      title: 'التوصيل',
      hideOnMobile: true,
      render: (order) => (
        <span className="text-sm text-muted-foreground">
          {[order.city, order.region].filter(Boolean).join(' — ') || '—'}
        </span>
      ),
    },
    {
      key: 'items',
      title: 'العناصر',
      hideOnMobile: true,
      render: (order) => <span className="text-sm tabular-nums text-muted-foreground">{itemCount(order)} قطعة</span>,
    },
    {
      key: 'fulfilment',
      title: 'التجهيز',
      render: (order) => (
        <Badge variant={FULFILMENT_VARIANT[orderFulfilmentState(order)]}>
          {FULFILMENT_LABELS[orderFulfilmentState(order)]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (order) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label="عرض تفاصيل الطلب"
          onClick={() => updateParams({ order: order.id })}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SetPageTitle
        titleAr="الطلبات"
        descriptionAr="متابعة مسار الطلب من طلب العميل حتى التسليم — قائمة أو كانبان حسب الحالة."
        iconName="ShoppingCart"
      />

      <StatTileGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={ShoppingCart} label="إجمالي الطلبات" value={total} tone="primary" loading={isLoading} />
        <StatTile
          icon={PackageCheck}
          label="طلبات غير مجهزة (هذه الصفحة)"
          value={unfulfilledCount}
          tone="gold"
          loading={isLoading}
        />
        <StatTile
          icon={RotateCcw}
          label="طلبات مرتجعة/ملغاة (هذه الصفحة)"
          value={returnedCount}
          tone="destructive"
          loading={isLoading}
        />
        <StatTile
          icon={ListChecks}
          label="طلبات مجهزة بالكامل (هذه الصفحة)"
          value={fulfilledCount}
          tone="success"
          loading={isLoading}
        />
      </StatTileGrid>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل الطلبات.</p> : null}

      {view === 'kanban' ? (
        <OrdersKanbanView
          orders={items}
          onOpen={(order) => updateParams({ order: order.id })}
          updatingOrderId={
            updateStatus.isPending
              ? updateStatus.variables?.orderId
              : updatePayment.isPending
                ? updatePayment.variables?.orderId
                : null
          }
          onStatusChange={(order, nextStatus) => {
            void updateStatus.mutateAsync({ orderId: order.id, status: nextStatus });
          }}
          onMarkPaid={(order) => {
            void updatePayment.mutateAsync({ orderId: order.id, paymentStatus: 'paid' });
          }}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={items}
            keyExtractor={(order) => order.id}
            loading={isLoading}
            emptyText="لا توجد طلبات مطابقة. أنشئ طلبًا من المتجر ليظهر هنا مباشرة."
            onRowClick={(order) => updateParams({ order: order.id })}
            alwaysShowTable
          />

          {data ? (
            <AppPagination
              page={page}
              pageSize={pageSize}
              total={data.pagination.total}
              onPageChange={(nextPage) => updateParams({ page: nextPage })}
              onPageSizeChange={(size) => updateParams({ pageSize: size, page: 1 })}
            />
          ) : null}
        </>
      )}

      <OrderDetailPanel
        order={selectedOrder}
        companyId={companyId}
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) updateParams({ order: null });
        }}
      />
    </div>
  );
}
