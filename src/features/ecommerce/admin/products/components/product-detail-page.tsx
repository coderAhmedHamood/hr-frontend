'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Layers, Package, Ruler, Save, Settings, Star, Trash2, Warehouse } from 'lucide-react';
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
import { ProductDetailHero } from '@/features/ecommerce/admin/products/components/product-detail-hero';
import { ProductRelatedDocsSidebar } from '@/features/ecommerce/admin/products/components/product-related-docs-sidebar';
import { ProductGeneralTab } from '@/features/ecommerce/admin/products/components/product-general-tab';
import { ProductAttributesTab } from '@/features/ecommerce/admin/products/components/product-attributes-tab';
import { ProductInventoryTab } from '@/features/ecommerce/admin/products/components/product-inventory-tab';
import { ProductReviewsTab } from '@/features/ecommerce/admin/products/components/product-reviews-tab';
import { ProductUnitsTab } from '@/features/ecommerce/admin/products/components/product-units-tab';
import { ProductSettingsTab } from '@/features/ecommerce/admin/products/components/product-settings-tab';
import { ProductStockMoveRequestDialog } from '@/features/ecommerce/admin/products/components/product-stock-move-request-dialog';
import { ProductStockMovesListDialog } from '@/features/ecommerce/admin/products/components/product-stock-moves-list-dialog';
import { ProductStockMovesHistoryDialog } from '@/features/ecommerce/admin/products/components/product-stock-moves-history-dialog';
import {
  isReplenishmentOperation,
  ProductReplenishmentListDialog,
} from '@/features/ecommerce/admin/products/components/product-replenishment-list-dialog';
import { ProductVariantsDialog } from '@/features/ecommerce/admin/products/components/product-variants-dialog';
import { DeleteProductDialog } from '@/features/ecommerce/admin/products/components/delete-product-dialog';
import type { ProductRelatedDocKey } from '@/features/ecommerce/admin/products/components/product-related-docs-bar';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Props = { productId: string };
type MoveRequestKind = WarehouseOperationKind;

const DETAIL_TABS = [
  { value: 'general', label: 'عام', icon: Package },
  { value: 'attributes', label: 'خصائص', icon: Layers },
  { value: 'availability', label: 'توفر', icon: Warehouse },
  { value: 'units', label: 'وحدات', icon: Ruler },
  { value: 'reviews', label: 'تقييمات', icon: Star },
  { value: 'settings', label: 'الإعدادات', icon: Settings },
] as const;

type DetailTab = (typeof DETAIL_TABS)[number]['value'];

/** Maps top-level form fields to the tab that renders them, so a validation error can jump the user there. */
const TAB_FIELDS: Record<DetailTab, string[]> = {
  general: [
    'sku',
    'categoryId',
    'brandId',
    'status',
    'listPrice',
    'costPrice',
    'compareAtPrice',
    'productType',
    'tracking',
    'invoicePolicy',
    'barcode',
    'weightKg',
    'lengthCm',
    'widthCm',
    'heightCm',
    'shortDescription',
    'description',
    'tagsInput',
    'nameEn',
    'slug',
    'metaTitle',
    'metaDescription',
  ],
  attributes: ['attributes', 'variants'],
  availability: ['stockStatus', 'stockQuantity', 'lowStockThreshold'],
  units: ['uomLines'],
  reviews: [],
  settings: [
    'isNewProduct',
    'newUntil',
    'isTodayDeal',
    'dealPriceAmount',
    'dealDays',
    'dealUntil',
    'isWholesale',
    'wholesalePriceAmount',
    'wholesaleUntil',
    'isDiscounted',
    'discountPercent',
    'discountUntil',
    'saleOk',
    'purchaseOk',
    'posAvailable',
    'trackInventory',
    'allowBackorder',
  ],
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
  // receipts/issues/internals counts are derived from allMovesData below (client-side
  // filter by kind) instead of 3 separate kind-filtered fetches of the same records.
  const { data: allMovesData } = useWarehouseOperations({ companyId, productId, limit: 200 });
  const { update, remove } = useProductMutations();

  const [activeTab, setActiveTab] = React.useState<DetailTab>('general');
  const [activeRelatedDoc, setActiveRelatedDoc] = React.useState<ProductRelatedDocKey | null>(null);
  const [moveRequestKind, setMoveRequestKind] = React.useState<MoveRequestKind | null>(null);
  const [movesListKind, setMovesListKind] = React.useState<MoveRequestKind | null>(null);
  const [movesHistoryOpen, setMovesHistoryOpen] = React.useState(false);
  const [replenishmentListOpen, setReplenishmentListOpen] = React.useState(false);
  const [variantsDialogOpen, setVariantsDialogOpen] = React.useState(false);
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
  };

  /**
   * react-hook-form's handleSubmit silently no-ops on validation failure unless an
   * invalid-handler is given — that made the save button look "broken" whenever a
   * cross-field rule (e.g. deal price required when "تخفيضات اليوم" is on) failed on a
   * tab the user wasn't currently viewing. Surface it and jump to the offending tab.
   */
  const onInvalid = (formErrors: typeof form.formState.errors) => {
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length === 0) return;
    if (errorKeys.includes('nameAr')) {
      toast.error('يرجى إدخال اسم المنتج أولًا.');
      return;
    }
    const offendingTab = DETAIL_TABS.find((tab) => TAB_FIELDS[tab.value].some((key) => errorKeys.includes(key)));
    if (offendingTab) {
      setActiveTab(offendingTab.value);
      toast.error(`تحقق من الحقول في تبويب «${offendingTab.label}» قبل الحفظ.`);
      return;
    }
    toast.error('تحقق من الحقول المطلوبة قبل الحفظ.');
  };

  const submitForm = () => void form.handleSubmit(onSubmit, onInvalid)();

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
        </div>
      ) : null,
    [product],
  );

  const handleDeleteConfirm = async () => {
    if (!product) return;
    await remove.mutateAsync({ companyId, id: product.id });
    setDeleteOpen(false);
    router.push(ecommerceAdminRoutes.products);
  };

  function onRelatedDoc(key: ProductRelatedDocKey) {
    if (!product) return;
    if (key === 'variants') {
      setActiveRelatedDoc('variants');
      setVariantsDialogOpen(true);
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
  const allMoves = allMovesData?.items ?? [];
  const receiptsCount = allMoves.filter((op) => op.kind === 'receipt').length;
  const replenishmentCount = allMoves.filter(isReplenishmentOperation).length;
  const issuesCount = allMoves.filter((op) => op.kind === 'issue').length;
  const internalsCount = allMoves.filter((op) => op.kind === 'internal').length;
  const movesCount = allMoves.reduce(
    (sum, op) => sum + op.lines.filter((line) => !line.productId || line.productId === product?.id).length,
    0,
  );

  if (isLoadingProduct) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-56 animate-pulse rounded-3xl bg-muted/60" />
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="h-11 animate-pulse rounded-2xl bg-muted/50" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-muted/40 lg:col-span-4" />
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

  const relatedDocsChips = [
    {
      key: 'variants' as const,
      label: 'متغيرات المنتج',
      count: variantsCount,
      hint: variantsCount > 0 ? 'عرض وتحرير أسعار وكميات المتغيرات' : 'أضف خصائص تُنشئ متغيرات لظهورها هنا',
    },
    {
      key: 'replenish' as const,
      label: 'تجديد المخزون',
      count: replenishmentCount,
      hint: 'طلبات تجديد المخزون وحالاتها — أنشئ طلبًا ثم صدّقه من المستودع',
    },
    { key: 'receipts' as const, label: 'الإدخالات', count: receiptsCount, hint: 'طلبات الاستلام الخاصة بهذا المنتج' },
    { key: 'issues' as const, label: 'الإخراجات', count: issuesCount, hint: 'طلبات الصرف الخاصة بهذا المنتج' },
    {
      key: 'internals' as const,
      label: 'داخلية',
      count: internalsCount,
      hint: 'الحركات الداخلية بين مواقع المستودع',
    },
    { key: 'moves' as const, label: 'سجل الحركات', count: movesCount, hint: 'كل حركات المخزون المرتبطة بهذا المنتج' },
    { key: 'putaway' as const, label: 'قواعد التخزين', count: putawayCount, hint: 'فتح قائمة قواعد التخزين لهذا المنتج' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr={product.nameAr} iconName="Package" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitForm();
        }}
        className="flex flex-col gap-5"
      >
        <ProductDetailHero
          control={form.control}
          register={form.register}
          setValue={form.setValue}
          nameError={form.formState.errors.nameAr?.message}
          currency={product.price.currency}
        />

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as DetailTab);
                if (value !== 'attributes') setActiveRelatedDoc(null);
              }}
              className="w-full space-y-4"
            >
              <div className="sticky top-0 z-10 -mx-1 overflow-x-auto rounded-2xl px-1 pb-1">
                <TabsList className="inline-flex h-auto min-w-full w-max justify-start gap-1 rounded-2xl border border-border/60 bg-muted/70 p-1.5 backdrop-blur">
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
                  getValues={form.getValues}
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
              <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
                <ProductReviewsTab companyId={companyId} productId={product.id} />
              </TabsContent>
              <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
                <ProductSettingsTab control={form.control} errors={form.formState.errors} register={form.register} />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:col-span-4">
            <div className="flex flex-col gap-4 lg:sticky lg:top-4">
              <ProductRelatedDocsSidebar
                chips={relatedDocsChips}
                activeKey={activeRelatedDoc}
                onSelect={onRelatedDoc}
              />
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-soft backdrop-blur sm:px-5">
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="submit"
              className="min-w-32 flex-1 gap-1.5 sm:flex-none"
              disabled={form.formState.isSubmitting || update.isPending}
            >
              <Save className="h-4 w-4" />
              {update.isPending ? 'جاري الحفظ…' : 'حفظ التغييرات'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={ecommerceAdminRoutes.products}>إلغاء</Link>
            </Button>
          </div>
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            التغييرات في كل التبويبات تُحفظ معًا عند الضغط على «حفظ التغييرات».
          </p>
        </div>
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

      <ProductVariantsDialog
        open={variantsDialogOpen}
        onOpenChange={(next) => {
          setVariantsDialogOpen(next);
          if (!next && activeRelatedDoc === 'variants') setActiveRelatedDoc(null);
        }}
        control={form.control}
        register={form.register}
        setValue={form.setValue}
        getValues={form.getValues}
        productId={product.id}
        productNameAr={nameAr || product.nameAr}
        onSave={submitForm}
        isSaving={update.isPending}
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
