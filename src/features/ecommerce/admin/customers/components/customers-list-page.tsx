'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import * as React from 'react';
import {
  ChevronLeft,
  Mail,
  MapPin,
  Package,
  Phone,
  Store,
  User,
  Users,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCustomers } from '@/features/ecommerce/admin/customers/hooks/use-customers';
import { useOrders } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import type { Customer } from '@/features/ecommerce/domain/types/customer';
import type { Order, OrderStatus } from '@/features/ecommerce/domain/types/order';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { StatTile, StatTileGrid } from '@/components/ui/stat-tile';
import { AppPagination } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { cn } from '@/shared/utils';

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

function CustomerCard({
  customer,
  expanded,
  onToggle,
}: {
  customer: Customer;
  expanded: boolean;
  onToggle: () => void;
}) {
  const companyId = getStorefrontCompanyId();
  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    companyId,
    customerId: customer.id,
    page: 1,
    limit: 20,
  });

  const orders = ordersData?.items ?? [];

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow',
        expanded ? 'border-primary/30 shadow-elevated' : 'border-border',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-4 text-start transition-colors hover:bg-muted/30 sm:gap-4 sm:px-5"
      >
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-transform',
            expanded && '-rotate-90',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </span>

        <Avatar className="h-11 w-11 shrink-0 border border-border">
          <AvatarFallback className="bg-primary/10 text-primary">
            {customer.nameAr.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{customer.nameAr}</span>
            <Badge variant={customer.isActive ? 'success' : 'subtle'}>
              {customer.isActive ? 'نشط' : 'غير نشط'}
            </Badge>
            {customer.source === 'storefront' ? (
              <Badge variant="subtle" className="gap-1">
                <Store className="h-3 w-3" />
                المتجر
              </Badge>
            ) : null}
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {customer.phone ? (
              <span className="inline-flex items-center gap-1.5" dir="ltr">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5" dir="ltr">
                <Mail className="h-3.5 w-3.5" />
                {customer.email}
              </span>
            )}
            {customer.city ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {customer.city}
              </span>
            ) : null}
          </p>
        </div>

        <div className="hidden shrink-0 text-end sm:block">
          <p className="text-sm text-muted-foreground">{customer.ordersCount} طلب</p>
          <p className="font-semibold tabular-nums text-foreground">
            {formatPrice({ amount: customer.totalSpentAmount, currency: customer.currency })}
          </p>
        </div>
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-border bg-linear-to-b from-muted/40 to-background px-4 py-5 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                بيانات التواصل
              </div>
              <p className="font-medium text-foreground">{customer.nameAr}</p>
              {customer.phone ? (
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                  {customer.phone}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                {customer.email}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                ملخص المشتريات
              </div>
              <p className="text-2xl font-semibold tabular-nums">{customer.ordersCount}</p>
              <p className="text-sm text-muted-foreground">عدد الطلبات</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">إجمالي الإنفاق</div>
              <p className="text-2xl font-semibold tabular-nums">
                {formatPrice({ amount: customer.totalSpentAmount, currency: customer.currency })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                آخر تحديث {formatDateTime(customer.updatedAt)}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">طلبات العميل</h3>
            {ordersLoading ? (
              <p className="text-sm text-muted-foreground">جاري تحميل الطلبات…</p>
            ) : null}
            {!ordersLoading && orders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                لا توجد طلبات لهذا العميل بعد.
              </p>
            ) : null}
            <div className="space-y-2">
              {orders.map((order: Order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium" dir="ltr">
                        {order.orderNumber}
                      </span>
                      <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                        {ORDER_STATUS_LABELS_AR[order.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                      {order.city ? ` • ${order.city}` : ''}
                      {` • ${order.items.length} منتج`}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatPrice(order.totalAmount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function CustomersListPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
  const expandedId = searchParams.get('customer') ?? '';

  const [searchInput, setSearchInput] = React.useState(search);

  function updateParams(next: {
    q?: string;
    page?: number;
    pageSize?: number;
    customer?: string | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q);
      else params.delete('q');
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
    }
    if (next.pageSize !== undefined) {
      if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(next.pageSize));
      else params.delete('pageSize');
    }
    if (next.customer !== undefined) {
      if (next.customer) params.set('customer', next.customer);
      else params.delete('customer');
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

  const { data, isLoading, isError, refetch } = useCustomers({
    companyId,
    search: search || undefined,
    page,
    limit: pageSize,
  });

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === 'ecommerce-admin-live-customers' ||
        event.key === 'ecommerce-admin-live-orders' ||
        event.key === null
      ) {
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

  usePageHeaderActions(() => <FilterToggleButton />, []);

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
            placeholder="ابحث بالاسم أو الهاتف أو المدينة…"
          />
        }
      />
    ),
    [searchInput],
  );

  return (
    <div className="flex flex-col gap-6">
      <SetPageTitle
        titleAr="العملاء"
        descriptionAr="سجل عملاء المتجر — بيانات التواصل وملخص الطلبات والإنفاق لكل عميل."
        iconName="Users"
      />

      <StatTileGrid className="sm:grid-cols-2">
        <StatTile icon={Users} label="إجمالي العملاء" value={data?.pagination.total ?? 0} tone="primary" loading={isLoading} />
        <StatTile
          icon={Store}
          label="من طلبات المتجر (هذه الصفحة)"
          value={(data?.items ?? []).filter((c) => c.source === 'storefront').length}
          tone="success"
          loading={isLoading}
        />
      </StatTileGrid>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل العملاء.</p> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">جاري التحميل…</p> : null}

      <div className="flex flex-col gap-3">
        {(data?.items ?? []).map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            expanded={expandedId === customer.id}
            onToggle={() =>
              updateParams({ customer: expandedId === customer.id ? null : customer.id })
            }
          />
        ))}
        {!isLoading && (data?.items.length ?? 0) === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-14 text-center text-sm text-muted-foreground">
            لا يوجد عملاء بعد. سيظهر عملاؤك هنا بعد أول طلب من المتجر.
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
