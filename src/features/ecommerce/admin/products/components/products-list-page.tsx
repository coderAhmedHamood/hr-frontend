'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Plus, Trash2, Package } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import { useProductMutations } from '@/features/ecommerce/admin/products/hooks/use-product-mutations';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import { ProductFormDialog } from '@/features/ecommerce/admin/products/components/product-form-dialog';
import { DeleteProductDialog } from '@/features/ecommerce/admin/products/components/delete-product-dialog';
import { ProductFiltersBar, type ProductFilters } from '@/features/ecommerce/admin/products/components/product-filters-bar';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { PRODUCT_STATUS_LABELS_AR } from '@/features/ecommerce/domain/constants/product-status';
import { STOCK_STATUS_LABELS_AR } from '@/features/ecommerce/domain/constants/stock-status';
import type { Product, ProductListQuery } from '@/features/ecommerce/domain/types/product';
import type { ProductStatus } from '@/features/ecommerce/domain/constants/product-status';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, AppPagination, type ColumnDef } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';

const FILTER_KEYS = ['categoryId', 'brandId', 'status', 'stockStatus', 'sort', 'sortDirection'] as const;

const STATUS_BADGE_VARIANT: Record<ProductStatus, 'success' | 'subtle' | 'outline'> = {
  active: 'success',
  draft: 'subtle',
  archived: 'outline',
};

const STOCK_BADGE_VARIANT: Record<StockStatus, 'success' | 'destructive' | 'warning' | 'outline'> = {
  in_stock: 'success',
  out_of_stock: 'destructive',
  preorder: 'warning',
  discontinued: 'outline',
};

export function ProductsListPage() {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
  const filters: ProductFilters = {
    categoryId: searchParams.get('categoryId') ?? undefined,
    brandId: searchParams.get('brandId') ?? undefined,
    status: (searchParams.get('status') as ProductFilters['status']) ?? undefined,
    stockStatus: (searchParams.get('stockStatus') as ProductFilters['stockStatus']) ?? undefined,
    sort: (searchParams.get('sort') as ProductFilters['sort']) ?? undefined,
    sortDirection: (searchParams.get('sortDirection') as ProductFilters['sortDirection']) ?? undefined,
  };

  const [searchInput, setSearchInput] = React.useState(search);

  function updateParams(next: { q?: string; page?: number; pageSize?: number } & Partial<ProductFilters>) {
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
    for (const key of FILTER_KEYS) {
      if (key in next) {
        const value = next[key];
        if (value) params.set(key, value);
        else params.delete(key);
      }
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

  const query: ProductListQuery = { companyId, search: search || undefined, page, limit: pageSize, ...filters };
  const { data, isLoading, isError } = useProducts(query);
  const { data: categoriesData } = useCategories({ companyId, limit: 100 });
  const { data: brandsData } = useBrands({ companyId, limit: 100 });
  const { remove } = useProductMutations();

  const [formState, setFormState] = React.useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  const openCreateDialog = () => setFormState({ open: true, product: null });
  const openEditDialog = (product: Product) => setFormState({ open: true, product });

  const handleDeleteConfirm = async (product: Product) => {
    await remove.mutateAsync({ companyId, id: product.id });
    setProductToDelete(null);
  };

  const columns: ColumnDef<Product>[] = [
    {
      key: 'product',
      title: 'المنتج',
      render: (product) => {
        const primaryImage = product.media.find((m) => m.isPrimary) ?? product.media[0];
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primaryImage.url} alt={primaryImage.alt} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{product.nameAr}</span>
              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      title: 'السعر',
      render: (product) => <span className="font-medium tabular-nums">{formatPrice(product.price)}</span>,
    },
    {
      key: 'quantity',
      title: 'الكمية',
      render: (product) => <span className="tabular-nums">{product.inventory.quantity}</span>,
    },
    {
      key: 'stockStatus',
      title: 'التوفر',
      render: (product) => (
        <Badge variant={STOCK_BADGE_VARIANT[product.stockStatus]}>{STOCK_STATUS_LABELS_AR[product.stockStatus]}</Badge>
      ),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (product) => <Badge variant={STATUS_BADGE_VARIANT[product.status]}>{PRODUCT_STATUS_LABELS_AR[product.status]}</Badge>,
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (product) => (
        <>
          <Button variant="ghost" size="icon" aria-label="تعديل المنتج" onClick={() => openEditDialog(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="حذف المنتج" onClick={() => setProductToDelete(product)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="المنتجات" iconName="Package" />

      <ListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="ابحث بالاسم أو رمز المنتج…"
        filters={
          <ProductFiltersBar
            filters={filters}
            onChange={(next) => updateParams({ ...next, page: 1 })}
            categories={categoriesData?.items}
            brands={brandsData?.items}
          />
        }
        actions={
          <Button onClick={openCreateDialog} disabled={!companyId}>
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Button>
        }
      />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل المنتجات.</p> : null}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        keyExtractor={(product) => product.id}
        loading={isLoading}
        emptyText="لا توجد منتجات بعد."
        onRowClick={openEditDialog}
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

      <ProductFormDialog
        open={formState.open}
        product={formState.product}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open }))}
      />
      <DeleteProductDialog
        product={productToDelete}
        isDeleting={remove.isPending}
        onConfirm={(product) => void handleDeleteConfirm(product)}
        onClose={() => setProductToDelete(null)}
      />
    </div>
  );
}
