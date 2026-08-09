'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Plus, Trash2, Tag } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import { useBrandMutations } from '@/features/ecommerce/admin/brands/hooks/use-brand-mutations';
import { BrandFormDialog } from '@/features/ecommerce/admin/brands/components/brand-form-dialog';
import { DeleteBrandDialog } from '@/features/ecommerce/admin/brands/components/delete-brand-dialog';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { isMultiLangEnabled } from '@/i18n/locale-flags';

export function BrandsListPage() {
  const companyId = getStorefrontCompanyId();
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

  const { data, isLoading, isError } = useBrands({ companyId, search: search || undefined, page, limit: pageSize });
  const { remove } = useBrandMutations();

  const [formState, setFormState] = React.useState<{ open: boolean; brand: Brand | null }>({
    open: false,
    brand: null,
  });
  const [brandToDelete, setBrandToDelete] = React.useState<Brand | null>(null);

  const openCreateDialog = () => setFormState({ open: true, brand: null });
  const openEditDialog = (brand: Brand) => setFormState({ open: true, brand });

  const handleDeleteConfirm = async (brand: Brand) => {
    await remove.mutateAsync({ companyId, id: brand.id });
    setBrandToDelete(null);
  };

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <PageHeaderPrimaryButton
          icon={Plus}
          label="إضافة علامة تجارية"
          disabled={!companyId}
          onClick={openCreateDialog}
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
          <EntityFilterSearchField value={searchInput} onChange={setSearchInput} placeholder="ابحث بالاسم…" />
        }
      />
    ),
    [searchInput],
  );

  const columns: ColumnDef<Brand>[] = [
    {
      key: 'brand',
      title: 'العلامة التجارية',
      render: (brand) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo.url} alt={brand.logo.alt} className="h-full w-full object-cover" />
            ) : (
              <Tag className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{brand.nameAr}</span>
            {isMultiLangEnabled && brand.nameEn ? (
              <span className="text-xs text-muted-foreground">{brand.nameEn}</span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'الوصف',
      render: (brand) => <span className="text-sm text-muted-foreground">{brand.description ?? '—'}</span>,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (brand) => <Badge variant={brand.isActive ? 'success' : 'subtle'}>{brand.isActive ? 'مفعّل' : 'معطّل'}</Badge>,
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (brand) => (
        <>
          <Button variant="ghost" size="icon" aria-label="تعديل العلامة التجارية" onClick={() => openEditDialog(brand)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="حذف العلامة التجارية" onClick={() => setBrandToDelete(brand)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="العلامات التجارية"
        descriptionAr="العلامات التجارية المرتبطة بمنتجات المتجر."
        iconName="Tag"
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل العلامات التجارية.</p> : null}

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
            columns={columns}
            data={rowsPage}
            keyExtractor={(brand) => brand.id}
            loading={isLoading}
            emptyText="لا توجد علامات تجارية بعد."
          />
        )}
      </DirectoryPagedViews>

      <BrandFormDialog
        open={formState.open}
        brand={formState.brand}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
      />
      <DeleteBrandDialog
        brand={brandToDelete}
        isDeleting={remove.isPending}
        onConfirm={(brand) => void handleDeleteConfirm(brand)}
        onClose={() => setBrandToDelete(null)}
      />
    </div>
  );
}
