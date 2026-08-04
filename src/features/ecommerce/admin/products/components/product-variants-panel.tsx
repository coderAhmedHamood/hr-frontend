'use client';

import * as React from 'react';
import { Camera, CheckCircle2, Loader2, Save } from 'lucide-react';
import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { toast } from 'sonner';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { syncProductVariants, dedupeAttributeValues } from '@/features/ecommerce/admin/products/lib/product-variants';
import { formValuesToCreateInput, productToFormValues } from '@/features/ecommerce/admin/products/lib/product-form-mapping';
import { isPersistedId } from '@/features/ecommerce/admin/products/lib/api/products';
import { useProductMutations } from '@/features/ecommerce/admin/products/hooks/use-product-mutations';
import { useProductOnHand } from '@/features/inventory/admin/hooks/use-product-on-hand';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  getValues: UseFormGetValues<ProductFormInput>;
  productId?: string | null;
};

export function ProductVariantsPanel({
  control,
  register,
  setValue,
  getValues,
  productId,
}: Props) {
  const companyId = getStorefrontCompanyId();
  const attributes = useWatch({ control, name: 'attributes' }) ?? [];
  const nameAr = useWatch({ control, name: 'nameAr' }) ?? '';
  const sku = useWatch({ control, name: 'sku' }) ?? '';
  const listPrice = Number(useWatch({ control, name: 'listPrice' }) ?? 0);
  const costPrice = Number(useWatch({ control, name: 'costPrice' }) ?? 0);
  const variantsWatch = useWatch({ control, name: 'variants' }) ?? [];
  const { fields, replace } = useFieldArray({
    control,
    name: 'variants',
    keyName: '_key',
  });
  const { data: onHand } = useProductOnHand(companyId, productId ?? undefined);
  const { saveAttributesVariants } = useProductMutations();

  const persistedCount = variantsWatch.filter((variant) => isPersistedId(variant.id)).length;
  const draftCount = variantsWatch.length - persistedCount;
  const allPersisted = variantsWatch.length > 0 && draftCount === 0;

  const signature = React.useMemo(
    () =>
      JSON.stringify({
        nameAr,
        sku,
        listPrice,
        costPrice,
        attributes: attributes.map((attribute) => ({
          id: attribute.id,
          createVariant: attribute.createVariant,
          values: attribute.values.map((value) => ({
            id: value.id,
            nameAr: value.nameAr,
            colorHex: value.colorHex,
            defaultExtraPrice: value.defaultExtraPrice,
          })),
        })),
      }),
    [attributes, nameAr, sku, listPrice, costPrice],
  );

  React.useEffect(() => {
    let attributesNeedClean = false;
    const cleanedAttributes = attributes.map((attribute) => {
      const values = dedupeAttributeValues(attribute.values ?? []);
      if (values.length !== (attribute.values?.length ?? 0)) attributesNeedClean = true;
      return { ...attribute, values };
    });
    if (attributesNeedClean) {
      setValue('attributes', cleanedAttributes, { shouldDirty: true });
      return;
    }

    const next = syncProductVariants({
      productNameAr: nameAr,
      productSku: sku,
      listPrice,
      costPrice,
      attributes: cleanedAttributes as Parameters<typeof syncProductVariants>[0]['attributes'],
      existing: variantsWatch.map((variant) => ({
        id: variant.id,
        combinationKey: variant.combinationKey,
        sku: variant.sku,
        nameAr: variant.nameAr,
        attributeValueIds: variant.attributeValueIds,
        attributeLabels: variant.attributeLabels,
        salePrice: { amount: Number(variant.salePrice) || 0, currency: 'YER' },
        costPrice: { amount: Number(variant.costPrice) || 0, currency: 'YER' },
        quantity: Number(variant.quantity) || 0,
        stockStatus: variant.stockStatus,
        barcode: variant.barcode,
        imageUrl: variant.imageUrl,
        isActive: variant.isActive,
      })),
    }).map((variant) => ({
      id: variant.id,
      combinationKey: variant.combinationKey,
      sku: variant.sku,
      nameAr: variant.nameAr,
      attributeValueIds: variant.attributeValueIds,
      attributeLabels: variant.attributeLabels,
      salePrice: variant.salePrice.amount,
      costPrice: variant.costPrice.amount,
      quantity: variant.quantity,
      stockStatus: variant.stockStatus,
      barcode: variant.barcode ?? '',
      imageUrl: variant.imageUrl ?? '',
      isActive: variant.isActive,
    }));

    const currentKey = JSON.stringify(
      variantsWatch.map((v) => [v.combinationKey, v.attributeLabels?.map((l) => l.valueNameAr)]),
    );
    const nextKey = JSON.stringify(
      next.map((v) => [v.combinationKey, v.attributeLabels.map((l) => l.valueNameAr)]),
    );
    if (currentKey !== nextKey) {
      replace(next);
      setValue('variants', next, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, replace, setValue]);

  function pickVariantImage(index: number) {
    const current = variantsWatch[index]?.imageUrl?.trim() ?? '';
    const nextUrl = window.prompt('أدخل رابط صورة المتغير', current || 'https://');
    if (nextUrl === null) return;
    const url = nextUrl.trim();
    setValue(`variants.${index}.imageUrl`, url, { shouldDirty: true });
  }

  async function handleSaveVariants() {
    if (!companyId) {
      toast.message('اختر الشركة أولاً');
      return;
    }
    if (!productId) {
      toast.message('احفظ المنتج أولاً ثم أضف المتغيرات');
      return;
    }
    if (attributes.length === 0) {
      toast.message('أضف خاصية واحدة على الأقل قبل حفظ المتغيرات');
      return;
    }
    if (variantsWatch.length === 0) {
      toast.message('لا توجد متغيرات للحفظ — تأكد أن الخاصية تُنشئ متغيرات');
      return;
    }

    const values = getValues() as ProductFormValues;
    const input = formValuesToCreateInput(values, companyId);
    try {
      const saved = await saveAttributesVariants.mutateAsync({
        companyId,
        id: productId,
        patch: {
          attributes: input.attributes,
          variants: input.variants,
        },
      });
      if (!saved) return;
      const nextForm = productToFormValues(saved);
      setValue('attributes', nextForm.attributes, { shouldDirty: false });
      setValue('variants', nextForm.variants, { shouldDirty: false });
    } catch {
      // toast handled by mutation onError
    }
  }

  const statusBadge =
    variantsWatch.length === 0 ? null : allPersisted ? (
      <Badge variant="subtle" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        محفوظة في قاعدة البيانات ({persistedCount})
      </Badge>
    ) : persistedCount > 0 ? (
      <Badge variant="subtle" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300">
        محفوظ جزئياً: {persistedCount} / {variantsWatch.length}
      </Badge>
    ) : (
      <Badge variant="subtle" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300">
        لم تُضف بعد ({draftCount} مسودة)
      </Badge>
    );

  if (fields.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed border-border px-4 py-5">
        <p className="text-xs text-muted-foreground">
          عند ربط خصائص تُنشئ متغيرات، تظهر هنا صفوف لكل تركيبة — بسعر وباركود وصورة لكل متغير.
        </p>
        <Button type="button" variant="secondary" disabled title="لا توجد متغيرات بعد">
          إضافة المتغيرات
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">متغيرات المنتج</p>
            {statusBadge}
          </div>
          <p className="text-xs text-muted-foreground">
            عدّل الأسعار ثم اضغط «إضافة المتغيرات» لحفظها في قاعدة البيانات. الكمية من مخزون المستودع بعد التصديق.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 gap-2"
          disabled={!productId || saveAttributesVariants.isPending || attributes.length === 0}
          onClick={() => void handleSaveVariants()}
          title={!productId ? 'احفظ المنتج أولاً' : undefined}
        >
          {saveAttributesVariants.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : allPersisted ? (
            <Save className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveAttributesVariants.isPending
            ? 'جاري الإضافة…'
            : allPersisted
              ? 'تحديث المتغيرات'
              : 'إضافة المتغيرات'}
        </Button>
      </div>

      {!productId ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-300">
          احفظ المنتج من زر «إنشاء المنتج / حفظ التغييرات» أولاً، ثم ارجع هنا لإضافة المتغيرات إلى قاعدة البيانات.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground">
              <th className="px-3 py-2.5 text-start font-medium">صورة</th>
              <th className="px-3 py-2.5 text-start font-medium">الاسم</th>
              <th className="px-3 py-2.5 text-start font-medium">الخصائص</th>
              <th className="px-3 py-2.5 text-start font-medium">الباركود</th>
              <th className="px-3 py-2.5 text-start font-medium">سعر البيع</th>
              <th className="px-3 py-2.5 text-start font-medium">التكلفة</th>
              <th className="px-3 py-2.5 text-start font-medium">الكمية</th>
              <th className="px-3 py-2.5 text-start font-medium">الحالة</th>
              <th className="px-3 py-2.5 text-start font-medium">مفعّل</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const labels = variantsWatch[index]?.attributeLabels ?? field.attributeLabels;
              const imageUrl = variantsWatch[index]?.imageUrl?.trim() ?? '';
              const rowId = variantsWatch[index]?.id ?? field.id;
              const rowPersisted = isPersistedId(rowId);
              return (
                <tr key={field._key} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 align-middle">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn('h-12 w-12 overflow-hidden p-0')}
                      onClick={() => pickVariantImage(index)}
                      aria-label="صورة المتغير"
                    >
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <input type="hidden" {...register(`variants.${index}.imageUrl`)} />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="font-medium text-foreground">
                      {variantsWatch[index]?.nameAr ?? field.nameAr}
                    </div>
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {variantsWatch[index]?.sku ?? field.sku}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex flex-wrap gap-1.5">
                      {labels.map((label) => (
                        <span
                          key={`${label.attributeNameAr}-${label.valueNameAr}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs"
                        >
                          {label.colorHex ? (
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-border"
                              style={{ backgroundColor: label.colorHex }}
                            />
                          ) : null}
                          {label.valueNameAr}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Input
                      type="text"
                      dir="ltr"
                      className="h-8 w-32"
                      placeholder="Barcode"
                      {...register(`variants.${index}.barcode`)}
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      dir="rtl"
                      className="h-8 w-24"
                      {...register(`variants.${index}.salePrice`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      dir="rtl"
                      className="h-8 w-24"
                      {...register(`variants.${index}.costPrice`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Input
                      type="number"
                      dir="rtl"
                      className="h-8 w-20 bg-muted/40"
                      value={
                        productId && onHand
                          ? (onHand.byVariant[variantsWatch[index]?.id ?? ''] ?? 0)
                          : Number(variantsWatch[index]?.quantity ?? 0)
                      }
                      readOnly
                      disabled
                      title="من مخزون المستودع"
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    {rowPersisted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        مضاف
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">مسودة</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Switch
                      checked={Boolean(variantsWatch[index]?.isActive ?? field.isActive)}
                      onCheckedChange={(checked) =>
                        setValue(`variants.${index}.isActive`, checked, { shouldDirty: true })
                      }
                      aria-label="تفعيل المتغير"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
