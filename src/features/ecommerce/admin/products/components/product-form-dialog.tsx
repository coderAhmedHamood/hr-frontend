'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import { useBrands } from '@/features/ecommerce/admin/brands/hooks/use-brands';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { usePutawayRules } from '@/features/inventory/admin/putaway-rules/hooks/use-putaway-rules';
import { useWarehouseOperations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operations';
import { useProductMutations } from '@/features/ecommerce/admin/products/hooks/use-product-mutations';
import {
  PRODUCT_FORM_DEFAULT_VALUES,
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
import { ProductStockMoveRequestDialog } from '@/features/ecommerce/admin/products/components/product-stock-move-request-dialog';
import { ProductStockMovesListDialog } from '@/features/ecommerce/admin/products/components/product-stock-moves-list-dialog';
import { ProductStockMovesHistoryDialog } from '@/features/ecommerce/admin/products/components/product-stock-moves-history-dialog';
import {
  isReplenishmentOperation,
  ProductReplenishmentListDialog,
} from '@/features/ecommerce/admin/products/components/product-replenishment-list-dialog';
import type { ProductRelatedDocKey } from '@/features/ecommerce/admin/products/components/product-related-docs-bar';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import type { Product } from '@/features/ecommerce/domain/types/product';
import type { WarehouseOperationKind } from '@/features/inventory/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

type Props = {
  product?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ensureSlug(values: ProductFormValues): ProductFormValues {
  if (values.slug?.trim()) return values;
  const fromSku = values.sku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return { ...values, slug: fromSku || `product-${Date.now()}` };
}

const TAB_TRIGGER_CLASS =
  'rounded-none border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none';

type FormTab = 'general' | 'attributes' | 'availability' | 'units' | 'storefront';
type MoveRequestKind = WarehouseOperationKind;

export function ProductFormDialog({ product, open, onOpenChange }: Props) {
  const companyId = getStorefrontCompanyId();
  const router = useRouter();
  const { data: categoriesData } = useCategories({ companyId, limit: 100 });
  const { data: brandsData } = useBrands({ companyId, limit: 100 });
  const { data: putawayData } = usePutawayRules(
    { companyId, productId: product?.id, limit: 1 },
    { enabled: Boolean(product?.id) },
  );
  const { data: receiptsData } = useWarehouseOperations({
    companyId,
    productId: product?.id,
    kind: 'receipt',
    limit: 100,
  });
  const { data: issuesData } = useWarehouseOperations({
    companyId,
    productId: product?.id,
    kind: 'issue',
    limit: 100,
  });
  const { data: internalsData } = useWarehouseOperations({
    companyId,
    productId: product?.id,
    kind: 'internal',
    limit: 100,
  });
  const { data: allMovesData } = useWarehouseOperations({
    companyId,
    productId: product?.id,
    limit: 200,
  });
  const { create, update } = useProductMutations();
  const isEditing = Boolean(product);
  const isSaving = create.isPending || update.isPending;
  const [activeTab, setActiveTab] = React.useState<FormTab>('general');
  const [activeRelatedDoc, setActiveRelatedDoc] = React.useState<ProductRelatedDocKey | null>(null);
  const [moveRequestKind, setMoveRequestKind] = React.useState<MoveRequestKind | null>(null);
  const [movesListKind, setMovesListKind] = React.useState<MoveRequestKind | null>(null);
  const [movesHistoryOpen, setMovesHistoryOpen] = React.useState(false);
  const [replenishmentListOpen, setReplenishmentListOpen] = React.useState(false);

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: PRODUCT_FORM_DEFAULT_VALUES,
  });

  const variants = useWatch({ control: form.control, name: 'variants' }) ?? [];
  const variantsCount = variants.length;
  const nameAr = useWatch({ control: form.control, name: 'nameAr' }) ?? '';
  const sku = useWatch({ control: form.control, name: 'sku' }) ?? '';

  React.useEffect(() => {
    if (!open) return;
    form.reset(product ? productToFormValues(product) : PRODUCT_FORM_DEFAULT_VALUES);
    setActiveTab('general');
    setActiveRelatedDoc(null);
    setMoveRequestKind(null);
    setMovesListKind(null);
    setMovesHistoryOpen(false);
    setReplenishmentListOpen(false);
  }, [open, product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    if (!companyId) return;
    let nextValues = ensureSlug(values);
    if (product?.id) {
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
    }
    const input = formValuesToCreateInput(nextValues, companyId, { existing: product });

    if (product) {
      await update.mutateAsync({ companyId, id: product.id, patch: input });
    } else {
      await create.mutateAsync(input);
    }
    onOpenChange(false);
  };

  function requireSavedProduct(actionLabel: string): boolean {
    if (product?.id) return true;
    toast.message(`احفظ المنتج أولًا ثم ${actionLabel}.`);
    return false;
  }

  function onRelatedDoc(key: ProductRelatedDocKey) {
    if (key === 'variants') {
      setActiveTab('attributes');
      setActiveRelatedDoc('variants');
      requestAnimationFrame(() => {
        document.getElementById('product-variants-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    if (key === 'replenish') {
      if (!requireSavedProduct('تعرض طلبات تجديد المخزون')) return;
      setActiveRelatedDoc('replenish');
      setReplenishmentListOpen(true);
      return;
    }
    if (key === 'receipts') {
      if (!requireSavedProduct('تعرض الإدخالات')) return;
      setActiveRelatedDoc('receipts');
      setMovesListKind('receipt');
      return;
    }
    if (key === 'issues') {
      if (!requireSavedProduct('تعرض الإخراجات')) return;
      setActiveRelatedDoc('issues');
      setMovesListKind('issue');
      return;
    }
    if (key === 'internals') {
      if (!requireSavedProduct('تعرض الحركات الداخلية')) return;
      setActiveRelatedDoc('internals');
      setMovesListKind('internal');
      return;
    }
    if (key === 'moves') {
      if (!requireSavedProduct('تعرض سجل الحركات')) return;
      setActiveRelatedDoc('moves');
      setMovesHistoryOpen(true);
      return;
    }
    if (key !== 'putaway') return;
    if (!requireSavedProduct('تفتح قواعد التخزين')) return;
    onOpenChange(false);
    router.push(`${ecommerceAdminRoutes.putawayRules}?productId=${product!.id}`);
  }

  const putawayCount = product?.id ? (putawayData?.pagination.total ?? putawayData?.items.length ?? 0) : 0;
  const receiptsCount = product?.id ? (receiptsData?.pagination.total ?? receiptsData?.items.length ?? 0) : 0;
  const replenishmentCount = product?.id
    ? (allMovesData?.items ?? []).filter(isReplenishmentOperation).length
    : 0;
  const issuesCount = product?.id ? (issuesData?.pagination.total ?? issuesData?.items.length ?? 0) : 0;
  const internalsCount = product?.id
    ? (internalsData?.pagination.total ?? internalsData?.items.length ?? 0)
    : 0;
  const movesCount = product?.id
    ? (allMovesData?.items ?? []).reduce(
        (sum, op) => sum + op.lines.filter((line) => !line.productId || line.productId === product.id).length,
        0,
      )
    : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-4xl sm:max-w-4xl')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle className="text-base font-semibold">
              {isEditing ? 'تعديل المنتج' : 'منتج جديد'}
            </DialogTitle>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className={cn(dialogShellBodyClass, 'space-y-5')}>
              <ProductFormHeader
                control={form.control}
                register={form.register}
                setValue={form.setValue}
                nameError={form.formState.errors.nameAr?.message}
                onRelatedDocSelect={onRelatedDoc}
                relatedDocsActiveKey={activeRelatedDoc}
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
                    hint: product?.id
                      ? 'فتح قائمة قواعد التخزين لهذا المنتج'
                      : 'احفظ المنتج أولًا لإضافة قواعد التخزين',
                  },
                ]}
              />

              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as FormTab);
                  if (value !== 'attributes') setActiveRelatedDoc(null);
                }}
                className="w-full"
              >
                <TabsList className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
                  <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>
                    المعلومات العامة
                  </TabsTrigger>
                  <TabsTrigger value="attributes" className={TAB_TRIGGER_CLASS}>
                    الخصائص والمتغيرات
                  </TabsTrigger>
                  <TabsTrigger value="availability" className={TAB_TRIGGER_CLASS}>
                    التوفر
                  </TabsTrigger>
                  <TabsTrigger value="units" className={TAB_TRIGGER_CLASS}>
                    الوحدات
                  </TabsTrigger>
                  <TabsTrigger value="storefront" className={TAB_TRIGGER_CLASS}>
                    المتجر وSEO
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-4">
                  <ProductGeneralTab
                    control={form.control}
                    errors={form.formState.errors}
                    register={form.register}
                    categories={categoriesData?.items}
                    brands={brandsData?.items}
                  />
                </TabsContent>
                <TabsContent value="attributes" className="mt-4">
                  <ProductAttributesTab
                    control={form.control}
                    errors={form.formState.errors}
                    register={form.register}
                    setValue={form.setValue}
                    productId={product?.id}
                  />
                </TabsContent>
                <TabsContent value="availability" className="mt-4">
                  <ProductInventoryTab
                    control={form.control}
                    errors={form.formState.errors}
                    register={form.register}
                    setValue={form.setValue}
                    productId={product?.id}
                  />
                </TabsContent>
                <TabsContent value="units" className="mt-4">
                  <ProductUnitsTab
                    control={form.control}
                    errors={form.formState.errors}
                    setValue={form.setValue}
                  />
                </TabsContent>
                <TabsContent value="storefront" className="mt-4">
                  <ProductStorefrontTab errors={form.formState.errors} register={form.register} />
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
              <Button type="submit" disabled={isSaving || !companyId}>
                {isSaving ? 'جاري الحفظ…' : isEditing ? 'حفظ' : 'إنشاء المنتج'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
        productId={product?.id}
        productNameAr={nameAr}
        productSku={sku}
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

      {product?.id ? (
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
      ) : null}

      {product?.id ? (
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
            setActiveRelatedDoc(
              kind === 'receipt' ? 'replenish' : kind === 'issue' ? 'issues' : 'internals',
            );
            setMoveRequestKind(kind);
          }}
        />
      ) : null}

      {product?.id ? (
        <ProductStockMovesHistoryDialog
          open={movesHistoryOpen}
          onOpenChange={(next) => {
            setMovesHistoryOpen(next);
            if (!next && activeRelatedDoc === 'moves') setActiveRelatedDoc(null);
          }}
          productId={product.id}
          productNameAr={nameAr || product.nameAr}
        />
      ) : null}
    </>
  );
}
