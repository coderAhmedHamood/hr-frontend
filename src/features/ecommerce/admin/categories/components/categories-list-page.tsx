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
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_ROOTS = '__all__';

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

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setDialogOpen(true);
  }

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
              {category.nameEn ? <span className="text-xs text-muted-foreground">{category.nameEn}</span> : null}
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
      <SetPageTitle titleAr={t('nav.categories')} iconName="FolderTree" />

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث بالاسم…"
        filters={
          <Select
            value={rootFilter || ALL_ROOTS}
            onValueChange={(value) => setRootFilter(value === ALL_ROOTS ? '' : value)}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="تصفية بالجذر">
              <SelectValue placeholder="كل الأشجار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROOTS}>كل الأشجار</SelectItem>
              {roots.map((root) => (
                <SelectItem key={root.id} value={root.id}>
                  {root.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label={tCommon('actions.retry')} onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="me-1 h-4 w-4" />
              إضافة تصنيف
            </Button>
          </div>
        }
      />

      {isError ? <p className="text-sm text-destructive">{t('catalog.loadError')}</p> : null}

      <DataTable
        columns={columns}
        data={treeRows}
        keyExtractor={(category) => category.id}
        loading={isLoading}
        emptyText={t('catalog.empty')}
      />

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        categories={items}
      />
    </div>
  );
}
