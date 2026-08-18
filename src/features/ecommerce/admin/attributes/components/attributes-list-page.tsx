'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  useCatalogAttributeMutations,
  useCatalogAttributes,
} from '@/features/ecommerce/admin/attributes/hooks/use-catalog-attributes';
import { CatalogAttributeFormDialog } from '@/features/ecommerce/admin/attributes/components/catalog-attribute-form-dialog';
import {
  ATTRIBUTE_DISPLAY_OPTIONS,
  VARIANT_CREATION_OPTIONS,
} from '@/features/ecommerce/admin/attributes/schemas/catalog-attribute-schema';
import type { CatalogAttribute } from '@/features/ecommerce/domain/types/catalog-attribute';
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

export function AttributesListPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

  const [searchInput, setSearchInput] = React.useState(search);
  const [formState, setFormState] = React.useState<{ open: boolean; attribute: CatalogAttribute | null }>({
    open: false,
    attribute: null,
  });
  const [toDelete, setToDelete] = React.useState<CatalogAttribute | null>(null);

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

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() !== search) updateParams({ q: searchInput.trim(), page: 1 });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const { data, isLoading, isError } = useCatalogAttributes({
    companyId,
    search: search || undefined,
    page,
    limit: pageSize,
  });
  const { remove } = useCatalogAttributeMutations();

  const displayLabel = (value: CatalogAttribute['displayType']) =>
    ATTRIBUTE_DISPLAY_OPTIONS.find((option) => option.value === value)?.labelAr ?? value;
  const variantLabel = (value: CatalogAttribute['createVariant']) =>
    VARIANT_CREATION_OPTIONS.find((option) => option.value === value)?.labelAr ?? value;

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <PageHeaderPrimaryButton
          icon={Plus}
          label="جديد"
          disabled={!companyId}
          onClick={() => setFormState({ open: true, attribute: null })}
        />
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
          <EntityFilterSearchField value={searchInput} onChange={setSearchInput} placeholder="ابحث باسم الخاصية…" />
        }
      />
    ),
    [searchInput],
  );

  const columns: ColumnDef<CatalogAttribute>[] = [
    {
      key: 'name',
      title: 'الخاصية',
      render: (row) => (
        <button
          type="button"
          className="text-start font-medium hover:text-primary"
          onClick={() => setFormState({ open: true, attribute: row })}
        >
          {row.nameAr}
        </button>
      ),
    },
    {
      key: 'display',
      title: 'نوع العرض',
      render: (row) => <Badge variant="subtle">{displayLabel(row.displayType)}</Badge>,
    },
    {
      key: 'variant',
      title: 'إنشاء المتغيِّر',
      hideOnMobile: true,
      render: (row) => <span className="text-sm text-muted-foreground">{variantLabel(row.createVariant)}</span>,
    },
    {
      key: 'values',
      title: 'القيم',
      render: (row) => <span className="tabular-nums text-muted-foreground">{row.values.length}</span>,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'subtle'}>{row.isActive ? 'مفعّلة' : 'موقوف'}</Badge>
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
            aria-label="تعديل"
            onClick={() => setFormState({ open: true, attribute: row })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => setToDelete(row)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="الخصائص"
        descriptionAr="خصائص المنتجات المستخدمة لبناء المتغيّرات مثل المقاس واللون."
        iconName="SlidersHorizontal"
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل الخصائص.</p> : null}

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
            className="sto-table-host"
            columns={columns}
            data={rowsPage}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            emptyText="لا توجد خصائص بعد. أضف خاصية لاستخدامها في المنتجات."
            mobileCard={(row) => (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{row.nameAr}</p>
                    <p className="text-xs text-muted-foreground">{row.values.length} قيمة</p>
                  </div>
                  <Badge variant="subtle">{displayLabel(row.displayType)}</Badge>
                </div>
                <div
                  className="flex items-center justify-end gap-1 border-t border-border/60 pt-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="تعديل"
                    onClick={() => setFormState({ open: true, attribute: row })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => setToDelete(row)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          />
        )}
      </DirectoryPagedViews>

      <CatalogAttributeFormDialog
        open={formState.open}
        attribute={formState.attribute}
        onOpenChange={(open) => setFormState((state) => ({ ...state, open }))}
      />

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف الخاصية؟</DialogTitle>
            <DialogDescription>حذف «{toDelete?.nameAr}» من التهيئة.</DialogDescription>
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
