'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Pencil, Plus, Trash2, Warehouse } from 'lucide-react';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { useWarehouseMutations } from '@/features/inventory/admin/warehouses/hooks/use-warehouse-mutations';
import { WarehouseFormDialog } from '@/features/inventory/admin/warehouses/components/warehouse-form-dialog';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import type { Warehouse as WarehouseEntity } from '@/features/inventory/domain/types/warehouse';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function WarehousesListPage() {
  const companyId = getInventoryCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

  const [searchInput, setSearchInput] = React.useState(search);
  const [formState, setFormState] = React.useState<{ open: boolean; warehouse: WarehouseEntity | null }>({
    open: false,
    warehouse: null,
  });
  const [toDelete, setToDelete] = React.useState<WarehouseEntity | null>(null);

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

  const { data, isLoading, isError } = useWarehouses({
    companyId,
    search: search || undefined,
    page,
    limit: pageSize,
  });
  const { remove } = useWarehouseMutations();

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <PageHeaderPrimaryButton
          icon={Plus}
          label="إضافة مستودع"
          disabled={!companyId}
          onClick={() => setFormState({ open: true, warehouse: null })}
        >
          إضافة مستودع
        </PageHeaderPrimaryButton>
      </div>
    ),
    [companyId],
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
            placeholder="ابحث بالاسم أو الرمز…"
          />
        }
      />
    ),
    [searchInput],
  );

  const columns: ColumnDef<WarehouseEntity>[] = [
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (row) => (
        <button
          type="button"
          className="flex items-center gap-3 text-start transition-colors hover:text-primary"
          onClick={() => router.push(inventoryAdminRoutes.warehouseDetail(row.id))}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="flex flex-col">
            <span className="font-medium text-foreground">{row.nameAr}</span>
            <span className="text-xs text-muted-foreground">
              مختصر: <span dir="ltr">{row.code}</span>
            </span>
          </span>
        </button>
      ),
    },
    {
      key: 'address',
      title: 'العنوان',
      render: (row) => <span className="text-sm text-muted-foreground">{row.address ?? '—'}</span>,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'subtle'}>
          {row.status === 'active' ? 'نشط' : 'غير نشط'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (row) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="مواقع المستودع"
            onClick={() => router.push(inventoryAdminRoutes.locationsForWarehouse(row.id))}
          >
            <MapPin className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="تعديل المستودع"
            onClick={() => setFormState({ open: true, warehouse: row })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="حذف المستودع" onClick={() => setToDelete(row)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="المخازن" iconName="Warehouse" />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل المستودعات.</p> : null}

      <DirectoryPagedViews
        items={data?.items ?? []}
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
        {(rowsPage) => (
          <DataTable
            variant="directory"
            alwaysShowTable
            columns={columns}
            data={rowsPage}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            emptyText="لا توجد مستودعات بعد. أضف مستودعًا للبدء."
          />
        )}
      </DirectoryPagedViews>

      <WarehouseFormDialog
        open={formState.open}
        warehouse={formState.warehouse}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
      />

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف المستودع؟</DialogTitle>
            <DialogDescription>
              سيتم حذف «{toDelete?.nameAr}» من القائمة. يمكنك إعادة إنشائه لاحقًا.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={remove.isPending}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={!toDelete || remove.isPending}
              onClick={() => {
                if (!toDelete || !companyId) return;
                void remove.mutateAsync({ companyId, id: toDelete.id }).then(() => setToDelete(null));
              }}
            >
              {remove.isPending ? 'جاري الحذف…' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
