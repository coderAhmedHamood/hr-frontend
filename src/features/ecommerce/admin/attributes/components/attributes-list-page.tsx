'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
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
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, AppPagination, type ColumnDef } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
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
      <SetPageTitle titleAr="الخصائص" iconName="SlidersHorizontal" />

      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ابحث باسم الخاصية…"
        actions={
          <Button onClick={() => setFormState({ open: true, attribute: null })} disabled={!companyId}>
            <Plus className="h-4 w-4" />
            جديد
          </Button>
        }
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل الخصائص.</p> : null}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText="لا توجد خصائص بعد. أضف خاصية لاستخدامها في المنتجات."
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
