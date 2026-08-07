'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import * as React from 'react';
import {
  Banknote,
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
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OrderDetailPanel } from '@/features/ecommerce/admin/orders/components/order-detail-panel';
import { OrderPaymentProofThumb } from '@/features/ecommerce/admin/orders/components/order-payment-proof-thumb';
import { OrderStatusHistoryButton } from '@/features/ecommerce/admin/orders/components/order-status-history-button';
import { OrdersKanbanView } from '@/features/ecommerce/admin/orders/components/orders-kanban-view';
import {
  useOrders,
  useUpdateOrderPaymentStatus,
  useUpdateOrderStatus,
} from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import {
  getOrderPrepGuidance,
  ORDER_STATUS_LABELS_AR,
  ORDER_TERMINAL_STATUSES,
  PAYMENT_METHOD_LABELS_AR,
  PAYMENT_STATUS_LABELS_AR,
  resolveOrderPaymentMethod,
} from '@/features/ecommerce/domain/constants/order-status';
import type { Order, OrderFulfilmentFilter, OrderStatus } from '@/features/ecommerce/domain/types/order';
import { getCmsCompanyRecord } from '@/features/ecommerce/admin/cms/shared/cms-actions';
import { StoreBindingStorageCleaner } from '@/features/ecommerce/storefront/components/store-binding-storage-cleaner';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { StatTile, StatTileGrid } from '@/components/ui/stat-tile';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

type ViewMode = 'list' | 'kanban';

const KANBAN_PAGE_SIZE = 100;

const STATUS_FILTER_OPTIONS: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: 'all', label: 'كل الحالات' },
  ...(Object.keys(ORDER_STATUS_LABELS_AR) as OrderStatus[]).map((value) => ({
    value,
    label: ORDER_STATUS_LABELS_AR[value],
  })),
];

const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'كل حالات الدفع' },
  ...(Object.keys(PAYMENT_STATUS_LABELS_AR) as Array<keyof typeof PAYMENT_STATUS_LABELS_AR>).map(
    (value) => ({
      value,
      label: PAYMENT_STATUS_LABELS_AR[value],
    }),
  ),
] as const;

const PAYMENT_METHOD_FILTER_OPTIONS = [
  { value: 'all', label: 'كل طرق الدفع' },
  ...(Object.keys(PAYMENT_METHOD_LABELS_AR) as Array<keyof typeof PAYMENT_METHOD_LABELS_AR>).map(
    (value) => ({
      value,
      label: PAYMENT_METHOD_LABELS_AR[value],
    }),
  ),
] as const;

const FULFILMENT_FILTER_OPTIONS: Array<{ value: 'all' | OrderFulfilmentFilter; label: string }> = [
  { value: 'all', label: 'كل حالات التجهيز' },
  { value: 'unfulfilled', label: 'لم يُجهز' },
  { value: 'partial', label: 'تجهيز جزئي' },
  { value: 'fulfilled', label: 'تم التجهيز' },
];

const SOURCE_FILTER_OPTIONS = [
  { value: 'all', label: 'كل المصادر' },
  { value: 'storefront', label: 'المتجر' },
  { value: 'seed', label: 'يدوي / تجريبي' },
] as const;

const VALID_ORDER_STATUSES = new Set<OrderStatus>(
  Object.keys(ORDER_STATUS_LABELS_AR) as OrderStatus[],
);
const VALID_PAYMENT_STATUSES = new Set(Object.keys(PAYMENT_STATUS_LABELS_AR));
const VALID_PAYMENT_METHODS = new Set(Object.keys(PAYMENT_METHOD_LABELS_AR));
const VALID_FULFILMENTS = new Set<OrderFulfilmentFilter>(['fulfilled', 'partial', 'unfulfilled']);
const VALID_SOURCES = new Set(['storefront', 'seed']);

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

export function OrdersListPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const statusParam = searchParams.get('status') ?? 'all';
  const status = VALID_ORDER_STATUSES.has(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined;
  const paymentStatusParam = searchParams.get('paymentStatus') ?? 'all';
  const paymentStatus = VALID_PAYMENT_STATUSES.has(paymentStatusParam)
    ? (paymentStatusParam as 'pending' | 'paid' | 'failed' | 'refunded')
    : undefined;
  const paymentMethodParam = searchParams.get('paymentMethod') ?? 'all';
  const paymentMethod = VALID_PAYMENT_METHODS.has(paymentMethodParam)
    ? (paymentMethodParam as 'cash_on_delivery' | 'card')
    : undefined;
  const fulfilmentParam = searchParams.get('fulfilment') ?? 'all';
  const fulfilment = VALID_FULFILMENTS.has(fulfilmentParam as OrderFulfilmentFilter)
    ? (fulfilmentParam as OrderFulfilmentFilter)
    : undefined;
  const sourceParam = searchParams.get('source') ?? 'all';
  const source = VALID_SOURCES.has(sourceParam)
    ? (sourceParam as 'storefront' | 'seed')
    : undefined;
  const cityFilter = searchParams.get('city') ?? 'all';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const view: ViewMode = searchParams.get('view') === 'list' ? 'list' : 'kanban';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize =
    view === 'kanban'
      ? KANBAN_PAGE_SIZE
      : Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
  const selectedOrderId = searchParams.get('order') ?? '';

  const [cityOptions, setCityOptions] = React.useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: 'كل المدن' },
  ]);

  React.useEffect(() => {
    let cancelled = false;
    void getCmsCompanyRecord(companyId)
      .then((record) => {
        if (cancelled) return;
        const cities = record?.checkout?.cities ?? [];
        setCityOptions([
          { value: 'all', label: 'كل المدن' },
          ...cities.map((city) => ({ value: city, label: city })),
        ]);
      })
      .catch(() => {
        if (!cancelled) setCityOptions([{ value: 'all', label: 'كل المدن' }]);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const [searchInput, setSearchInput] = React.useState(search);
  const datePeriod = React.useMemo(
    () => ({ from: dateFrom, to: dateTo }),
    [dateFrom, dateTo],
  );

  function updateParams(next: {
    q?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    fulfilment?: string;
    source?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
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
      if (next.status && next.status !== 'all') params.set('status', next.status);
      else params.delete('status');
    }
    if (next.paymentStatus !== undefined) {
      if (next.paymentStatus && next.paymentStatus !== 'all') {
        params.set('paymentStatus', next.paymentStatus);
      } else params.delete('paymentStatus');
    }
    if (next.paymentMethod !== undefined) {
      if (next.paymentMethod && next.paymentMethod !== 'all') {
        params.set('paymentMethod', next.paymentMethod);
      } else params.delete('paymentMethod');
    }
    if (next.fulfilment !== undefined) {
      if (next.fulfilment && next.fulfilment !== 'all') params.set('fulfilment', next.fulfilment);
      else params.delete('fulfilment');
    }
    if (next.source !== undefined) {
      if (next.source && next.source !== 'all') params.set('source', next.source);
      else params.delete('source');
    }
    if (next.city !== undefined) {
      if (next.city && next.city !== 'all') params.set('city', next.city);
      else params.delete('city');
    }
    if (next.dateFrom !== undefined) {
      if (next.dateFrom) params.set('dateFrom', next.dateFrom);
      else params.delete('dateFrom');
    }
    if (next.dateTo !== undefined) {
      if (next.dateTo) params.set('dateTo', next.dateTo);
      else params.delete('dateTo');
    }
    if (next.view !== undefined) {
      if (next.view === 'list') params.set('view', 'list');
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

  const { data, isLoading, isError } = useOrders({
    companyId,
    search: search || undefined,
    status: view === 'kanban' ? undefined : status,
    paymentStatus,
    paymentMethod,
    fulfilment,
    source,
    city: cityFilter === 'all' ? undefined : cityFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page: view === 'kanban' ? 1 : page,
    limit: pageSize,
  });

  const updateStatus = useUpdateOrderStatus(companyId);
  const updatePayment = useUpdateOrderPaymentStatus(companyId);

  const items = data?.items ?? [];
  const selectedOrder = items.find((order) => order.id === selectedOrderId) ?? null;

  const total = data?.pagination.total ?? 0;
  const unfulfilledCount = items.filter((order) => orderFulfilmentState(order) !== 'fulfilled').length;
  const returnedCount = items.filter((order) => ORDER_TERMINAL_STATUSES.includes(order.status)).length;
  const fulfilledCount = items.filter((order) => orderFulfilmentState(order) === 'fulfilled').length;

  const viewButtons: { mode: ViewMode; icon: typeof List; label: string }[] = [
    { mode: 'kanban', icon: Kanban, label: 'كانبان' },
    { mode: 'list', icon: List, label: 'قائمة' },
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
              onClick={() => updateParams({ view: mode, page: 1, status: mode === 'kanban' ? 'all' : status ?? 'all' })}
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
        showDateSection
        optionalDateRange
        showStatusSection={false}
        showEmployeePicker={false}
        periodValue={datePeriod}
        onPeriodChange={(range) =>
          updateParams({ dateFrom: range.from, dateTo: range.to, page: 1 })
        }
        periodFilterActive={Boolean(dateFrom || dateTo)}
        onPeriodFilterClear={() => updateParams({ dateFrom: '', dateTo: '', page: 1 })}
        leadingFilters={
          <EntityFilterSearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="بحث برقم الطلب أو اسم العميل أو الهاتف…"
          />
        }
        inlineSelects={[
          ...(view === 'list'
            ? [
                {
                  id: 'status',
                  value: status ?? 'all',
                  onChange: (value: string) => updateParams({ status: value, page: 1 }),
                  placeholder: 'كل الحالات',
                  options: STATUS_FILTER_OPTIONS,
                },
              ]
            : []),
          {
            id: 'paymentMethod',
            value: paymentMethod ?? 'all',
            onChange: (value) => updateParams({ paymentMethod: value, page: 1 }),
            placeholder: 'كل طرق الدفع',
            options: [...PAYMENT_METHOD_FILTER_OPTIONS],
          },
          {
            id: 'paymentStatus',
            value: paymentStatus ?? 'all',
            onChange: (value) => updateParams({ paymentStatus: value, page: 1 }),
            placeholder: 'كل حالات الدفع',
            options: [...PAYMENT_STATUS_FILTER_OPTIONS],
          },
          {
            id: 'fulfilment',
            value: fulfilment ?? 'all',
            onChange: (value) => updateParams({ fulfilment: value, page: 1 }),
            placeholder: 'كل حالات التجهيز',
            options: FULFILMENT_FILTER_OPTIONS,
          },
        ]}
        moreFilters={[
          {
            id: 'source',
            value: source ?? 'all',
            onChange: (value) => updateParams({ source: value, page: 1 }),
            placeholder: 'كل المصادر',
            options: [...SOURCE_FILTER_OPTIONS],
          },
          {
            id: 'city',
            value: cityFilter,
            onChange: (value) => updateParams({ city: value, page: 1 }),
            placeholder: 'كل المدن',
            options: cityOptions,
          },
        ]}
      />
    ),
    [
      searchInput,
      status,
      paymentStatus,
      paymentMethod,
      fulfilment,
      source,
      cityFilter,
      cityOptions,
      view,
      dateFrom,
      dateTo,
      datePeriod,
    ],
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
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{order.customerNameAr}</span>
          {order.phone ? (
            <a
              href={`tel:${order.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-primary hover:underline"
              dir="ltr"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" />
              {order.phone}
            </a>
          ) : null}
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
      render: (order) => {
        const prep = getOrderPrepGuidance(order);
        const isCard = prep.paymentMethod === 'card';
        return (
          <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold',
                  isCard ? 'text-sky-800 dark:text-sky-300' : 'text-teal-800 dark:text-teal-300',
                )}
              >
                {isCard ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                {prep.methodLabel}
              </span>
              <Badge variant={PAYMENT_STATUS_VARIANT[order.paymentStatus ?? 'pending']}>
                {prep.statusLabel}
              </Badge>
              <span
                className={cn(
                  'text-[11px] leading-snug',
                  prep.canPrepare
                    ? isCard
                      ? 'text-sky-700 dark:text-sky-400'
                      : 'text-teal-700 dark:text-teal-400'
                    : 'text-amber-700 dark:text-amber-400',
                )}
              >
                {prep.prepLabel}
              </span>
            </div>
            <OrderPaymentProofThumb
              urls={order.paymentProofUrls}
              url={order.paymentProofUrl}
              orderNumber={order.orderNumber}
              size="sm"
            />
          </div>
        );
      },
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
        <div className="flex items-center gap-0.5">
          <OrderStatusHistoryButton
            companyId={companyId}
            orderId={order.id}
            orderNumber={order.orderNumber}
            history={order.statusHistory}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="عرض تفاصيل الطلب"
            onClick={() => updateParams({ order: order.id })}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <StoreBindingStorageCleaner />
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
          companyId={companyId}
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
            if (order.status === nextStatus) return;
            void updateStatus.mutateAsync({ orderId: order.id, status: nextStatus });
          }}
          onMarkPaid={(order) => {
            void updatePayment.mutateAsync({ orderId: order.id, paymentStatus: 'paid' });
          }}
        />
      ) : (
        <DirectoryPagedViews
          items={items}
          loading={isLoading}
          serverPagination={
            data
              ? {
                  page,
                  pageSize,
                  total: data.pagination.total,
                  totalPages: Math.max(1, Math.ceil(data.pagination.total / pageSize)),
                  setPage: (nextPage) => updateParams({ page: nextPage }),
                  setPageSize: (size) => updateParams({ pageSize: size, page: 1 }),
                }
              : undefined
          }
        >
          {(ordersPage) => (
            <DataTable
              columns={columns}
              data={ordersPage}
              keyExtractor={(order) => order.id}
              loading={isLoading}
              emptyText="لا توجد طلبات مطابقة. أنشئ طلبًا من المتجر ليظهر هنا مباشرة."
              onRowClick={(order) => updateParams({ order: order.id })}
              alwaysShowTable
            />
          )}
        </DirectoryPagedViews>
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
