'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowRight,
  Layers,
  Package,
  Ruler,
  Save,
  Settings,
  Store,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { usePutawayRules } from '@/features/inventory/admin/putaway-rules/hooks/use-putaway-rules';
import { useWarehouseOperations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operations';
import { useProduct } from '@/features/ecommerce/admin/products/hooks/use-products';
import { useProductMutations } from '@/features/ecommerce/admin/products/hooks/use-product-mutations';
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  formValuesToCreateInput,
  productToFormValues,
} from '@/features/ecommerce/admin/products/lib/product-form-mapping';
import { ProductFormHeader } from '@/features/ecommerce/admin/products/components/product-form-header';
import { ProductGeneralTab } from '@/features/ecommerce/admin/products/components/product-general-tab';
import { ProductAttributesTab } from '@/features/ecommerce/admin/products/components/product-attributes-tab';
import { ProductInventoryTab } from '@/features/ecommerce/admin/products/components/product-inventory-tab';
import { ProductStorefrontTab } from '@/features/ecommerce/admin/products/components/product-storefront-tab';
import { ProductUnitsTab } from '@/features/ecommerce/admin/products/components/product-units-tab';
import { ProductSettingsTab } from '@/features/ecommerce/admin/products/components/product-settings-tab';
import { ProductStockMoveRequestDialog } from '@/features/ecommerce/admin/products/components/product-stock-move-request-dialog';
import { ProductStockMovesListDialog } from '@/features/ecommerce/admin/products/components/product-stock-moves-list-dialog';
import { ProductStockMovesHistoryDialog } from '@/features/ecommerce/admin/products/components/product-stock-moves-history-dialog';
import {
  isReplenishmentOperation,
  ProductReplenishmentListDialog,
} from '@/features/ecommerce/admin/products/components/product-replenishment-list-dialog';
import { DeleteProductDialog } from '@/features/ecommerce/admin/products/components/delete-product-dialog';
import type { ProductRelatedDocKey } from '@/features/ecommerce/admin/products/components/product-related-docs-bar';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { PRODUCT_STATUS_LABELS_AR } from '@/features/ecommerce/domain/constants/product-status';
import { STOCK_STATUS_LABELS_AR } from '@/features/ecommerce/domain/constants/stock-status';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import type { ProductStatus } from '@/features/ecommerce/domain/constants/product-status';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Props = { productId: string };
type MoveRequestKind = WarehouseOperationKind;

const DETAIL_TABS = [
  { value: 'general', label: 'عام', icon: Package },
  { value: 'attributes', label: 'خصائص', icon: Layers },
  { value: 'availability', label: 'توفر', icon: Warehouse },
  { value: 'units', label: 'وحدات', icon: Ruler },
  { value: 'storefront', label: 'متجر', icon: Store },
  { value: 'settings', label: 'الإعدادات', icon: Settings },
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]['value'];

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

function ensureSlug(values: ProductFormValues): ProductFormValues {
  if (values.slug?.trim()) return values;
  const fromSku = values.sku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return { ...values, slug: fromSku || `product-${Date.now()}` };
}

export function ProductDetailPage({ productId }: Props) {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const { data: categoriesData } = useCategories({ companyId, limit: 100 });
  const { data: brandsData } = useBrands({ companyId, limit: 100 });
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isProductError,
  } = useProduct(companyId, productId);
  const { data: putawayData } = usePutawayRules({ companyId, productId, limit: 1 });
  const { data: receiptsData } = useWarehouseOperations({ companyId, productId, kind: 'receipt', limit: 100 });
  const { data: issuesData } = useWarehouseOperations({ companyId, productId, kind: 'issue', limit: 100 });
  const { data: internalsData } = useWarehouseOperations({ companyId, productId, kind: 'internal', limit: 100 });
  const { data: allMovesData } = useWarehouseOperations({ companyId, productId, limit: 200 });
  const { update, remove } = useProductMutations();

  const [activeTab, setActiveTab] = React.useState<DetailTab>('general');
  const [activeRelatedDoc, setActiveRelatedDoc] = React.useState<ProductRelatedDocKey | null>(null);
  const [moveRequestKind, setMoveRequestKind] = React.useState<MoveRequestKind | null>(null);
  const [movesListKind, setMovesListKind] = React.useState<MoveRequestKind | null>(null);
  const [movesHistoryOpen, setMovesHistoryOpen] = React.useState(false);
  const [replenishmentListOpen, setReplenishmentListOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
  });

  const variants = useWatch({ control: form.control, name: 'variants' }) ?? [];
  const variantsCount = variants.length;
  const nameAr = useWatch({ control: form.control, name: 'nameAr' }) ?? '';
  const sku = useWatch({ control: form.control, name: 'sku' }) ?? '';

  React.useEffect(() => {
    if (product) form.reset(productToFormValues(product));
  }, [product, form]);

  usePageHeaderActions(
    () =>
      product ? (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">حذف</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={form.formState.isSubmitting || update.isPending}
            onClick={() => void form.handleSubmit(onSubmit)()}
          >
            <Save className="h-4 w-4" />
            {update.isPending ? 'جاري الحفظ…' : 'حفظ التغييرات'}
          </Button>
        </div>
      ) : null,
    [product, form.formState.isSubmitting, update.isPending],
  );

  const onSubmit = async (values: ProductFormValues) => {
    if (!companyId || !product) return;
    let nextValues = ensureSlug(values);
    const onHand = await inventoryStockService.getOnHandByVariant(companyId, product.id);
    nextValues = {
      ...nextValues,
      stockQuantity: onHand.total,
      variants: nextValues.variants.map((variant) => ({
        ...variant,
        quantity: onHand.byVariant[variant.id] ?? 0,
        stockStatus: (onHand.byVariant[variant.id] ?? 0) > 0 ? 'in_stock' : variant.stockStatus,
      })),
    };
    const input = formValuesToCreateInput(nextValues, companyId, { existing: product });
    await update.mutateAsync({ companyId, id: product.id, patch: input });
    toast.success('تم حفظ التغييرات.');
  };

  const handleDeleteConfirm = async () => {
    if (!product) return;
    await remove.mutateAsync({ companyId, id: product.id });
    setDeleteOpen(false);
    router.push(ecommerceAdminRoutes.products);
  };

  function onRelatedDoc(key: ProductRelatedDocKey) {
    if (!product) return;
    if (key === 'variants') {
      setActiveTab('attributes');
      setActiveRelatedDoc('variants');
      requestAnimationFrame(() => {
        document.getElementById('product-variants-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    if (key === 'replenish') {
      setActiveRelatedDoc('replenish');
      setReplenishmentListOpen(true);
      return;
    }
    if (key === 'receipts') {
      setActiveRelatedDoc('receipts');
      setMovesListKind('receipt');
      return;
    }
    if (key === 'issues') {
      setActiveRelatedDoc('issues');
      setMovesListKind('issue');
      return;
    }
    if (key === 'internals') {
      setActiveRelatedDoc('internals');
      setMovesListKind('internal');
      return;
    }
    if (key === 'moves') {
      setActiveRelatedDoc('moves');
      setMovesHistoryOpen(true);
      return;
    }
    if (key !== 'putaway') return;
    router.push(`${ecommerceAdminRoutes.putawayRules}?productId=${product.id}`);
  }

  const putawayCount = putawayData?.pagination.total ?? putawayData?.items.length ?? 0;
  const receiptsCount = receiptsData?.pagination.total ?? receiptsData?.items.length ?? 0;
  const replenishmentCount = (allMovesData?.items ?? []).filter(isReplenishmentOperation).length;
  const issuesCount = issuesData?.pagination.total ?? issuesData?.items.length ?? 0;
  const internalsCount = internalsData?.pagination.total ?? internalsData?.items.length ?? 0;
  const movesCount = (allMovesData?.items ?? []).reduce(
    (sum, op) => sum + op.lines.filter((line) => !line.productId || line.productId === product?.id).length,
    0,
  );

  if (isLoadingProduct) {
    return (
      <div className="space-y-5">
        <div className="h-44 animate-pulse rounded-3xl bg-muted/60" />
        <div className="h-11 animate-pulse rounded-xl bg-muted/50" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  if (isProductError || !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <Package className="h-10 w-10 text-muted-foreground/50" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">تعذر تحميل المنتج</p>
          <p className="text-sm text-muted-foreground">تحقق من الرابط أو عد للقائمة وحاول مجددًا.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={ecommerceAdminRoutes.products}>العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  const offerBadges = [
    product.isNewProductActive ? { key: 'new', variant: 'subtle' as const, label: 'حديث' } : null,
    product.isTodayDealActive ? { key: 'deal', variant: 'warning' as const, label: 'تخفيض اليوم' } : null,
    product.isWholesaleActive ? { key: 'wholesale', variant: 'outline' as const, label: 'جملة' } : null,
    product.isDiscountActive
      ? {
          key: 'discount',
          variant: 'destructive' as const,
          label: `خصم${product.discountPercent != null ? ` ${product.discountPercent}%` : ''}`,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; variant: BadgeProps['variant']; label: string }>;

  return (
    <div className="flex flex-col gap-6">
      <SetPageTitle titleAr={product.nameAr} iconName="Package" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit(onSubmit)(e);
        }}
        className="flex flex-col gap-5"
      >
        <ProductFormHeader
          control={form.control}
          register={form.register}
          setValue={form.setValue}
          nameError={form.formState.errors.nameAr?.message}
          isEditing
          onRelatedDocSelect={onRelatedDoc}
          relatedDocsActiveKey={activeRelatedDoc}
          topBar={
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full border border-border/80 bg-background/80"
                asChild
                aria-label="رجوع"
              >
                <Link href={ecommerceAdminRoutes.products}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={STATUS_BADGE_VARIANT[product.status]}>
                  {PRODUCT_STATUS_LABELS_AR[product.status]}
                </Badge>
                <Badge variant={STOCK_BADGE_VARIANT[product.stockStatus]}>
                  {STOCK_STATUS_LABELS_AR[product.stockStatus]}
                </Badge>
                {offerBadges.map((badge) => (
                  <Badge key={badge.key} variant={badge.variant}>
                    {badge.label}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-sm">
                  {product.isTodayDealActive && product.dealPrice ? (
                    <>
                      <span className="font-semibold tabular-nums text-primary">
                        {formatPrice(product.dealPrice)}
                      </span>
                      <span className="tabular-nums text-muted-foreground line-through">
                        {formatPrice(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-sm text-muted-foreground">
                  الكمية:{' '}
                  <span className="font-medium tabular-nums text-foreground">{product.inventory.quantity}</span>
                </div>
              </div>
            </>
          }
          relatedDocs={[
            {
              key: 'variants',
              label: 'متغيرات المنتج',
              count: variantsCount,
              hint:
                variantsCount > 0
                  ? 'عرض وتحرير أسعار وكميات المتغيرات'
                  : 'أضف خصائص تُنشئ متغيرات لظهورها هنا',
            },
            {
              key: 'replenish',
              label: 'تجديد المخزون',
              count: replenishmentCount,
              hint: 'طلبات تجديد المخزون وحالاتها — أنشئ طلبًا ثم صدّقه من المستودع',
            },
            {
              key: 'receipts',
              label: 'الإدخالات',
              count: receiptsCount,
              hint: 'طلبات الاستلام الخاصة بهذا المنتج',
            },
            {
              key: 'issues',
              label: 'الإخراجات',
              count: issuesCount,
              hint: 'طلبات الصرف الخاصة بهذا المنتج',
            },
            {
              key: 'internals',
              label: 'داخلية',
              count: internalsCount,
              hint: 'الحركات الداخلية بين مواقع المستودع',
            },
            {
              key: 'moves',
              label: 'سجل الحركات',
              count: movesCount,
              hint: 'كل حركات المخزون المرتبطة بهذا المنتج',
            },
            {
              key: 'putaway',
              label: 'قواعد التخزين',
              count: putawayCount,
              hint: 'فتح قائمة قواعد التخزين لهذا المنتج',
            },
          ]}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as DetailTab);
            if (value !== 'attributes') setActiveRelatedDoc(null);
          }}
          className="w-full space-y-4"
        >
          <div className="sticky top-0 z-10 -mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="inline-flex h-auto min-w-full w-max justify-start gap-1 rounded-2xl bg-muted/70 p-1.5">
              {DETAIL_TABS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="h-9 gap-1.5 rounded-xl px-3 text-xs sm:text-sm data-[state=active]:shadow-soft"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="general" className="mt-0 focus-visible:outline-none">
            <ProductGeneralTab
              control={form.control}
              errors={form.formState.errors}
              register={form.register}
              categories={categoriesData?.items}
              brands={brandsData?.items}
            />
          </TabsContent>
          <TabsContent value="attributes" className="mt-0 focus-visible:outline-none">
            <ProductAttributesTab
              control={form.control}
              errors={form.formState.errors}
              register={form.register}
              setValue={form.setValue}
              productId={product.id}
            />
          </TabsContent>
          <TabsContent value="availability" className="mt-0 focus-visible:outline-none">
            <ProductInventoryTab
              control={form.control}
              errors={form.formState.errors}
              register={form.register}
              setValue={form.setValue}
              productId={product.id}
            />
          </TabsContent>
          <TabsContent value="units" className="mt-0 focus-visible:outline-none">
            <ProductUnitsTab control={form.control} errors={form.formState.errors} setValue={form.setValue} />
          </TabsContent>
          <TabsContent value="storefront" className="mt-0 focus-visible:outline-none">
            <ProductStorefrontTab errors={form.formState.errors} register={form.register} />
          </TabsContent>
          <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
            <ProductSettingsTab control={form.control} errors={form.formState.errors} register={form.register} />
          </TabsContent>
        </Tabs>
      </form>

      <ProductStockMoveRequestDialog
        open={moveRequestKind !== null}
        onOpenChange={(next) => {
          if (!next) {
            setMoveRequestKind(null);
            if (
              activeRelatedDoc === 'replenish' ||
              activeRelatedDoc === 'issues' ||
              activeRelatedDoc === 'internals'
            ) {
              setActiveRelatedDoc(null);
            }
          }
        }}
        kind={moveRequestKind ?? 'receipt'}
        productId={product.id}
        productNameAr={nameAr || product.nameAr}
        productSku={sku || product.sku}
        variants={variants}
        onCreated={(_warehouseId, kind) => {
          setMoveRequestKind(null);
          if (kind === 'receipt' || kind === 'replenishment') {
            setActiveRelatedDoc('replenish');
            setReplenishmentListOpen(true);
            return;
          }
          setActiveRelatedDoc(null);
        }}
      />

      <ProductReplenishmentListDialog
        open={replenishmentListOpen}
        onOpenChange={(next) => {
          setReplenishmentListOpen(next);
          if (!next && activeRelatedDoc === 'replenish') setActiveRelatedDoc(null);
        }}
        productId={product.id}
        productNameAr={nameAr || product.nameAr}
        onCreateRequest={() => {
          setReplenishmentListOpen(false);
          setActiveRelatedDoc('replenish');
          setMoveRequestKind('replenishment');
        }}
      />

      <ProductStockMovesListDialog
        open={movesListKind !== null}
        onOpenChange={(next) => {
          if (!next) {
            setMovesListKind(null);
            if (
              activeRelatedDoc === 'receipts' ||
              activeRelatedDoc === 'issues' ||
              activeRelatedDoc === 'internals'
            ) {
              setActiveRelatedDoc(null);
            }
          }
        }}
        kind={movesListKind ?? 'receipt'}
        productId={product.id}
        productNameAr={nameAr || product.nameAr}
        onCreateRequest={() => {
          const kind = movesListKind ?? 'receipt';
          setMovesListKind(null);
          setActiveRelatedDoc(kind === 'receipt' ? 'replenish' : kind === 'issue' ? 'issues' : 'internals');
          setMoveRequestKind(kind);
        }}
      />

      <ProductStockMovesHistoryDialog
        open={movesHistoryOpen}
        onOpenChange={(next) => {
          setMovesHistoryOpen(next);
          if (!next && activeRelatedDoc === 'moves') setActiveRelatedDoc(null);
        }}
        productId={product.id}
        productNameAr={nameAr || product.nameAr}
      />

      <DeleteProductDialog
        product={deleteOpen ? product : null}
        isDeleting={remove.isPending}
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
