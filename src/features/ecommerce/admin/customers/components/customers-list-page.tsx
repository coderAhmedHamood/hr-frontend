'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useCustomers } from '@/features/ecommerce/admin/customers/hooks/use-customers';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import type { Customer } from '@/features/ecommerce/domain/types/customer';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DataTable, AppPagination, type ColumnDef } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';

export function CustomersListPage() {
  const companyId = useAuthStore((s) => s.activeCompanyId) ?? '';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

  const [searchInput, setSearchInput] = React.useState(search);

  function updateParams(next: { q?: string; page?: number; pageSize?: number }) {
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

  const { data, isLoading, isError } = useCustomers({ companyId, search: search || undefined, page, limit: pageSize });

  const columns: ColumnDef<Customer>[] = [
    {
      key: 'customer',
      title: 'العميل',
      render: (customer) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{customer.nameAr.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{customer.nameAr}</span>
            <span className="text-xs text-muted-foreground" dir="ltr">{customer.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'orders',
      title: 'الطلبات',
      render: (customer) => <span className="tabular-nums">{customer.ordersCount}</span>,
    },
    {
      key: 'spent',
      title: 'إجمالي الإنفاق',
      render: (customer) => (
        <span className="font-medium tabular-nums">
          {formatPrice({ amount: customer.totalSpentAmount, currency: customer.currency })}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (customer) => (
        <Badge variant={customer.isActive ? 'success' : 'subtle'}>{customer.isActive ? 'نشط' : 'غير نشط'}</Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="العملاء" iconName="Users" />

      <ListToolbar searchValue={searchInput} onSearchChange={setSearchInput} searchPlaceholder="ابحث بالاسم أو البريد الإلكتروني…" />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل العملاء.</p> : null}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(customer) => customer.id}
        loading={isLoading}
        emptyText="لا يوجد عملاء بعد."
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
    </div>
  );
}
