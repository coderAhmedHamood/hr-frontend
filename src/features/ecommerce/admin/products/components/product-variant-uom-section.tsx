'use client';

import { Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createDefaultUomLines } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { ProductUomLinesEditor } from '@/features/ecommerce/admin/products/components/product-uom-lines-editor';
import { PRODUCT_VARIANT_CUSTOM_UOM_ENABLED } from '@/features/ecommerce/admin/products/constants/product-feature-flags';
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  variants: ProductFormInput['variants'];
};

export function ProductVariantUomSection({ control, errors, setValue, variants }: Props) {
  if (!variants || variants.length === 0) return null;

  const comingSoon = !PRODUCT_VARIANT_CUSTOM_UOM_ENABLED;

  return (
    <div
      className={cn(
        'space-y-4 rounded-xl border border-border bg-muted/20 p-4',
        comingSoon && 'border-dashed',
      )}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">تعبئة مختلفة بين المتغيرات</p>
          {comingSoon ? (
            <Badge variant="secondary" className="gap-1 text-[10px] font-normal">
              <Clock className="h-3 w-3" />
              قريباً
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {comingSoon
            ? 'حالياً اعتمد على وحدات المنتج من تبويب «وحدات» لجميع المتغيرات. تعبئة مخصصة لكل متغير (مثل درزن مختلف بين المقاسات) ستتوفر في تحديث قادم.'
            : 'مثال: حليب صغير — الدرزن = 12 كرتون، حليب كبير — الدرزن = 6 كرتون. فعّل «تعبئة مخصصة»، اختر وحدات من الكتالogg، ثم احفظ عبر «تحديث المتغيرات» أو «حفظ التغييرات».'}
        </p>
      </div>

      <div className={cn('space-y-4', comingSoon && 'pointer-events-none opacity-60')}>
        {variants.map((variant, index) => {
          const hasCustom = PRODUCT_VARIANT_CUSTOM_UOM_ENABLED && variant.hasCustomUom === true;
          return (
            <div key={variant.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{variant.nameAr}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {variant.sku}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={hasCustom}
                    disabled={comingSoon}
                    onCheckedChange={(checked) => {
                      if (comingSoon) return;
                      setValue(`variants.${index}.hasCustomUom`, checked, { shouldDirty: true });
                      if (checked && (!variant.uomLines || variant.uomLines.length === 0)) {
                        setValue(`variants.${index}.uomLines`, createDefaultUomLines(), { shouldDirty: true });
                      }
                      if (!checked) {
                        setValue(`variants.${index}.uomLines`, undefined, { shouldDirty: true });
                      }
                    }}
                  />
                  تعبئة مخصصة
                </label>
              </div>
              {hasCustom ? (
                <div className="mt-3">
                  <ProductUomLinesEditor
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    fieldPath={`variants.${index}.uomLines`}
                    compact
                  />
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  يستخدم وحدات المنتج من تبويب «وحدات».
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
