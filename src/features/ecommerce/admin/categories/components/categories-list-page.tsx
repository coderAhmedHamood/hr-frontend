'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FolderTree, Pencil, Plus, RefreshCw, Package } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import { CategoryFormDialog } from '@/features/ecommerce/admin/categories/components/category-form-dialog';
import {
  getCategoryPath,
  sortCategoriesAsTree,
} from '@/features/ecommerce/admin/categories/lib/category-tree';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, usePagination, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { isMultiLangEnabled } from '@/i18n/locale-flags';

export function CategoriesListPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const t = useTranslations('ecommerceAdmin');
  const tCommon = useTranslations('common');
  const [search, setSearch] = React.useState('');
  const [rootFilter, setRootFilter] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);

  const { data, isLoading, isError, refetch } = useCategories({
    companyId,
    search: search || undefined,
    limit: 300,
  });
  const { data: productsData } = useProducts({ companyId, limit: 500 });

  const items = React.useMemo(() => data?.items ?? [], [data?.items]);
  const byId = React.useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const productCountByCategory = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of productsData?.items ?? []) {
      if (!product.categoryId) continue;
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [productsData?.items]);

  const roots = React.useMemo(
    () => items.filter((item) => !item.parentId).sort((a, b) => a.displayOrder - b.displayOrder),
    [items],
  );

  const treeRows = React.useMemo(() => {
    let list = sortCategoriesAsTree(items);
    if (rootFilter) {
      list = list.filter((category) => {
        const path = getCategoryPath(category, byId);
        return path.pathIds[0] === rootFilter;
      });
    }
    return list;
  }, [items, byId, rootFilter]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    slice: pagedRows,
    total,
  } = usePagination(treeRows, DEFAULT_PAGE_SIZE);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setDialogOpen(true);
  }

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={tCommon('actions.retry')}
          onClick={() => void refetch()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <PageHeaderPrimaryButton icon={Plus} label="إضافة تصنيف" onClick={openCreate} />
      </div>
    ),
    [tCommon, refetch],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={
          <EntityFilterSearchField value={search} onChange={setSearch} placeholder="ابحث بالاسم…" />
        }
        inlineSelects={[
          {
            id: 'root',
            value: rootFilter || 'all',
            onChange: (value) => setRootFilter(value === 'all' ? '' : value),
            placeholder: 'كل الأشجار',
            options: [
              { value: 'all', label: 'كل الأشجار' },
              ...roots.map((root) => ({ value: root.id, label: root.nameAr })),
            ],
          },
        ]}
      />
    ),
    [search, rootFilter, roots],
  );

  const columns: ColumnDef<Category>[] = [
    {
      key: 'category',
      title: 'التصنيف / المسار',
      render: (category) => {
        const meta = getCategoryPath(category, byId);
        return (
          <div className="flex items-start gap-3" style={{ paddingInlineStart: `${(meta.depth - 1) * 16}px` }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {category.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={category.image.url} alt={category.image.alt} className="h-full w-full object-cover" />
              ) : (
                <FolderTree className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{category.nameAr}</span>
                <Badge variant="outline">مستوى {meta.depth}</Badge>
              </div>
              <p className="text-xs text-muted-foreground" title={meta.pathLabel}>
                {meta.pathLabel}
              </p>
              {isMultiLangEnabled && category.nameEn ? (
                <span className="text-xs text-muted-foreground">{category.nameEn}</span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      key: 'products',
      title: 'المنتجات',
      render: (category) => {
        const count = productCountByCategory.get(category.id) ?? 0;
        return (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1 tabular-nums"
            onClick={() =>
              router.push(`${ecommerceAdminRoutes.products}?categoryId=${category.id}`)
            }
          >
            <Package className="h-3.5 w-3.5" />
            {count}
          </Button>
        );
      },
    },
    {
      key: 'brands',
      title: 'ماركات',
      render: (category) => (
        <span className="text-sm text-muted-foreground">{category.featuredBrandIds?.length ?? 0}</span>
      ),
    },
    {
      key: 'slug',
      title: 'الرابط',
      render: (category) => (
        <span className="text-sm text-muted-foreground" dir="ltr">
          {category.slug}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (category) => (
        <Badge variant={category.isActive ? 'success' : 'subtle'}>{category.isActive ? 'مفعّل' : 'معطّل'}</Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (category) => (
        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(category)}>
          <Pencil className="me-1 h-3.5 w-3.5" />
          تعديل
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr={t('nav.categories')}
        descriptionAr="تصنيفات المتجر الهرمية — الروابط، المنتجات المرتبطة، وحالة كل تصنيف."
        iconName="FolderTree"
      />

      {isError ? <p className="text-sm text-destructive">{t('catalog.loadError')}</p> : null}

      <DirectoryPagedViews
        items={pagedRows}
        loading={isLoading}
        serverPagination={{
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          setPage,
          setPageSize,
        }}
      >
        {(rowsPage) => (
          <DataTable
            columns={columns}
            data={rowsPage}
            keyExtractor={(category) => category.id}
            loading={isLoading}
            emptyText={t('catalog.empty')}
          />
        )}
      </DirectoryPagedViews>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        categories={items}
      />
    </div>
  );
}
