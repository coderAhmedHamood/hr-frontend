'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
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
import { type ProductFilters } from '@/features/ecommerce/admin/products/components/product-filters-bar';
import {
  categoryFilterLabel,
  sortCategoriesAsTree,
} from '@/features/ecommerce/admin/categories/lib/category-tree';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { PRODUCT_STATUS_LABELS_AR, PRODUCT_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/product-status';
import { STOCK_STATUS_LABELS_AR, STOCK_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/stock-status';
import type { Product, ProductListQuery } from '@/features/ecommerce/domain/types/product';
import type { ProductStatus } from '@/features/ecommerce/domain/constants/product-status';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, AppPagination, type ColumnDef } from '@/components/ui/data-table';
import { DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';

const FILTER_KEYS = [
  'categoryId',
  'brandId',
  'status',
  'stockStatus',
  'sort',
  'sortDirection',
  'isNewProduct',
  'isTodayDeal',
  'isWholesale',
  'isDiscounted',
] as const;

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

const SORT_OPTIONS: { value: NonNullable<ProductListQuery['sort']>; labelAr: string }[] = [
  { value: 'name', labelAr: 'الاسم' },
  { value: 'price', labelAr: 'السعر' },
  { value: 'stock', labelAr: 'الكمية' },
  { value: 'createdAt', labelAr: 'تاريخ الإضافة' },
  { value: 'updatedAt', labelAr: 'آخر تحديث' },
];

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
    isNewProduct: searchParams.get('isNewProduct') === 'true' ? true : undefined,
    isTodayDeal: searchParams.get('isTodayDeal') === 'true' ? true : undefined,
    isWholesale: searchParams.get('isWholesale') === 'true' ? true : undefined,
    isDiscounted: searchParams.get('isDiscounted') === 'true' ? true : undefined,
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
        if (value === true) params.set(key, 'true');
        else if (typeof value === 'string' && value) params.set(key, value);
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

  const categoryByIdMap = React.useMemo(
    () => new Map((categoriesData?.items ?? []).map((category) => [category.id, category])),
    [categoriesData],
  );
  const categoryOptions = React.useMemo(() => {
    const ordered = sortCategoriesAsTree(categoriesData?.items ?? []);
    return ordered.map((category) => ({
      value: category.id,
      label: categoryFilterLabel(category, categoryByIdMap),
    }));
  }, [categoriesData, categoryByIdMap]);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <PageHeaderPrimaryButton icon={Plus} label="إضافة منتج" disabled={!companyId} onClick={openCreateDialog} />
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
            placeholder="ابحث بالاسم أو رمز المنتج…"
          />
        }
        inlineSelects={[
          {
            id: 'categoryId',
            value: filters.categoryId ?? 'all',
            onChange: (value) => updateParams({ categoryId: value === 'all' ? undefined : value, page: 1 }),
            placeholder: 'كل التصنيفات',
            options: [{ value: 'all', label: 'كل التصنيفات' }, ...categoryOptions],
          },
          {
            id: 'brandId',
            value: filters.brandId ?? 'all',
            onChange: (value) => updateParams({ brandId: value === 'all' ? undefined : value, page: 1 }),
            placeholder: 'كل العلامات التجارية',
            options: [
              { value: 'all', label: 'كل العلامات التجارية' },
              ...(brandsData?.items ?? []).map((brand) => ({ value: brand.id, label: brand.nameAr })),
            ],
          },
          {
            id: 'status',
            value: filters.status ?? 'all',
            onChange: (value) =>
              updateParams({ status: value === 'all' ? undefined : (value as ProductFilters['status']), page: 1 }),
            placeholder: 'كل الحالات',
            options: [
              { value: 'all', label: 'كل الحالات' },
              ...PRODUCT_STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.labelAr })),
            ],
          },
          {
            id: 'stockStatus',
            value: filters.stockStatus ?? 'all',
            onChange: (value) =>
              updateParams({ stockStatus: value === 'all' ? undefined : (value as ProductFilters['stockStatus']), page: 1 }),
            placeholder: 'كل حالات التوفر',
            options: [
              { value: 'all', label: 'كل حالات التوفر' },
              ...STOCK_STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.labelAr })),
            ],
          },
        ]}
        moreFilters={[
          {
            id: 'offer',
            value:
              filters.isNewProduct
                ? 'isNewProduct'
                : filters.isTodayDeal
                  ? 'isTodayDeal'
                  : filters.isWholesale
                    ? 'isWholesale'
                    : filters.isDiscounted
                      ? 'isDiscounted'
                      : 'all',
            onChange: (value) =>
              updateParams({
                isNewProduct: value === 'isNewProduct' ? true : undefined,
                isTodayDeal: value === 'isTodayDeal' ? true : undefined,
                isWholesale: value === 'isWholesale' ? true : undefined,
                isDiscounted: value === 'isDiscounted' ? true : undefined,
                page: 1,
              }),
            placeholder: 'كل العروض',
            options: [
              { value: 'all', label: 'كل العروض' },
              { value: 'isNewProduct', label: 'منتج حديث' },
              { value: 'isTodayDeal', label: 'تخفيضات اليوم' },
              { value: 'isWholesale', label: 'أسعار جملة' },
              { value: 'isDiscounted', label: 'خصومات' },
            ],
          },
          {
            id: 'sort',
            value: filters.sort ?? 'all',
            onChange: (value) =>
              updateParams({
                sort: value === 'all' ? undefined : (value as ProductFilters['sort']),
                sortDirection: filters.sortDirection ?? 'asc',
                page: 1,
              }),
            placeholder: 'الترتيب الافتراضي',
            options: [
              { value: 'all', label: 'الترتيب الافتراضي' },
              ...SORT_OPTIONS.map((option) => ({ value: option.value, label: option.labelAr })),
            ],
          },
        ]}
      />
    ),
    [searchInput, filters, categoryOptions, brandsData],
  );

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
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{product.nameAr}</span>
              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
              <div className="flex flex-wrap gap-1">
                {product.isNewProductActive ? (
                  <Badge variant="subtle">حديث</Badge>
                ) : null}
                {product.isTodayDealActive ? (
                  <Badge variant="warning">تخفيض اليوم</Badge>
                ) : null}
                {product.isWholesale ? (
                  <Badge variant="outline">جملة</Badge>
                ) : null}
                {product.isDiscountActive ? (
                  <Badge variant="destructive">
                    خصم{product.discountPercent != null ? ` ${product.discountPercent}%` : ''}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      title: 'السعر',
      render: (product) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium tabular-nums">{formatPrice(product.price)}</span>
          {product.isWholesale && product.wholesalePrice ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              جملة: {formatPrice(product.wholesalePrice)}
            </span>
          ) : null}
        </div>
      ),
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
      <SetPageTitle
        titleAr="المنتجات"
        descriptionAr="كتالوج منتجات المتجر — الأسعار والمخزون وحالة كل منتج."
        iconName="Package"
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
