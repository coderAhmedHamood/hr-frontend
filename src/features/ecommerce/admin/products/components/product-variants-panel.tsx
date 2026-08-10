'use client';

import * as React from 'react';
import { Camera } from 'lucide-react';
import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { syncProductVariants } from '@/features/ecommerce/admin/products/lib/product-variants';
import { useProductOnHand } from '@/features/inventory/admin/hooks/use-product-on-hand';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  productId?: string | null;
};

export function ProductVariantsPanel({ control, register, setValue, productId }: Props) {
  const companyId = getStorefrontCompanyId();
  const attributes = useWatch({ control, name: 'attributes' }) ?? [];
  const nameAr = useWatch({ control, name: 'nameAr' }) ?? '';
  const sku = useWatch({ control, name: 'sku' }) ?? '';
  const listPrice = Number(useWatch({ control, name: 'listPrice' }) ?? 0);
  const costPrice = Number(useWatch({ control, name: 'costPrice' }) ?? 0);
  const variantsWatch = useWatch({ control, name: 'variants' }) ?? [];
  const { fields, replace } = useFieldArray({ control, name: 'variants' });
  const { data: onHand } = useProductOnHand(companyId, productId ?? undefined);

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
    const next = syncProductVariants({
      productNameAr: nameAr,
      productSku: sku,
      listPrice,
      costPrice,
      attributes: attributes as Parameters<typeof syncProductVariants>[0]['attributes'],
      existing: variantsWatch.map((variant) => ({
        id: variant.id,
        combinationKey: variant.combinationKey,
        sku: variant.sku,
        nameAr: variant.nameAr,
        attributeValueIds: variant.attributeValueIds,
        attributeLabels: variant.attributeLabels,
        salePrice: { amount: Number(variant.salePrice) || 0, currency: 'SAR' },
        costPrice: { amount: Number(variant.costPrice) || 0, currency: 'SAR' },
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

  if (fields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        عند ربط خصائص تُنشئ متغيرات، تظهر هنا صفوف لكل تركيبة — بسعر وكمية وباركود وصورة لكل متغير.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-foreground">متغيرات المنتج</p>
        <p className="text-xs text-muted-foreground">
          سعر البيع والشراء والباركود والصورة قابلة للتعديل. الكمية من مخزون المستودع بعد التصديق.
        </p>
      </div>

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
              <th className="px-3 py-2.5 text-start font-medium">مفعّل</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const labels = variantsWatch[index]?.attributeLabels ?? field.attributeLabels;
              const imageUrl = variantsWatch[index]?.imageUrl?.trim() ?? '';
              return (
                <tr key={field.id} className="border-b border-border last:border-0">
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
                      dir="ltr"
                      className="h-8 w-24"
                      {...register(`variants.${index}.salePrice`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      dir="ltr"
                      className="h-8 w-24"
                      {...register(`variants.${index}.costPrice`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Input
                      type="number"
                      dir="ltr"
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
