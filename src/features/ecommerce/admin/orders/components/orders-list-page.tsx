'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import * as React from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OrderLineShipPanel } from '@/features/ecommerce/admin/orders/components/order-line-ship-panel';
import { useOrders } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppPagination } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { cn } from '@/shared/utils';

const FILTER_PILLS: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: 'الكل' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'processing', label: 'قيد التجهيز' },
  { value: 'delivered', label: 'مُسلَّم' },
];

const ORDER_STATUS_LABELS_AR: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

const ORDER_STATUS_VARIANT: Record<OrderStatus, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  confirmed: 'outline',
  processing: 'gold',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'destructive',
  refunded: 'destructive',
};

function OrderCard({
  order,
  companyId,
  expanded,
  onToggle,
}: {
  order: Order;
  companyId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const locationLabel = [order.city, order.region].filter(Boolean).join(' • ');

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-4 text-start transition-colors hover:bg-muted/40"
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-transform',
            expanded && '-rotate-90',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground" dir="ltr">
              {order.orderNumber}
            </span>
            <Badge variant={ORDER_STATUS_VARIANT[order.status]}>{ORDER_STATUS_LABELS_AR[order.status]}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {order.customerNameAr}
              {locationLabel ? ` • ${locationLabel}` : ''}
            </span>
          </p>
        </div>

        <div className="shrink-0 text-end">
          <p className="font-semibold tabular-nums text-foreground">{formatPrice(order.totalAmount)}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {order.createdAt.slice(0, 10)}
          </p>
        </div>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {order.items.length} منتج في الطلب — اختر موقع الشحن حسب الكمية المتوفرة لكل منتج.
            </p>
            <Select value={order.status} disabled>
              <SelectTrigger className="w-44" aria-label="حالة الطلب">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ORDER_STATUS_LABELS_AR).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {order.items.map((line) => (
            <OrderLineShipPanel
              key={`${order.id}-${line.productId}`}
              companyId={companyId}
              orderId={order.id}
              line={line}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OrdersListPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') as OrderStatus | null) ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
  const expandedId = searchParams.get('order') ?? '';

  const [searchInput, setSearchInput] = React.useState(search);

  function updateParams(next: {
    q?: string;
    status?: string;
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
    status,
    page,
    limit: pageSize,
  });

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="الطلبات" iconName="ShoppingCart" />

      <div className="space-y-3">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="بحث برقم الطلب أو اسم العميل…"
          className="max-w-xl"
        />

        <div className="flex flex-wrap gap-2">
          {FILTER_PILLS.map((pill) => {
            const active = (status ?? '') === pill.value;
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => updateParams({ status: pill.value, page: 1 })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل الطلبات.</p> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">جاري التحميل…</p> : null}

      <div className="flex flex-col gap-3">
        {(data?.items ?? []).map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            companyId={companyId}
            expanded={expandedId === order.id}
            onToggle={() => updateParams({ order: expandedId === order.id ? null : order.id })}
          />
        ))}
        {!isLoading && (data?.items.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            لا توجد طلبات مطابقة.
          </p>
        ) : null}
      </div>

      {data ? (
        <AppPagination
          page={page}
          pageSize={pageSize}
          total={data.pagination.total}
          onPageChange={(nextPage) => updateParams({ page: nextPage })}
          onPageSizeChange={(size) => updateParams({ pageSize: size, page: 1 })}
        />
      ) : null}
    </div>
  );
}
