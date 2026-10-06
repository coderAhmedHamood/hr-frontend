'use client';

import { Switch } from '@/components/ui/switch';
import { createDefaultUomLines } from '@/features/catalog/products/schemas/product-schema';
import { ProductUomLinesEditor } from '@/features/catalog/products/components/product-uom-lines-editor';
import { PRODUCT_VARIANT_CUSTOM_UOM_ENABLED } from '@/features/catalog/products/constants/product-feature-flags';
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/catalog/products/schemas/product-schema';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  variants: ProductFormInput['variants'];
};

export function ProductVariantUomSection({ control, errors, setValue, variants }: Props) {
  if (!PRODUCT_VARIANT_CUSTOM_UOM_ENABLED) return null;
  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-semibold">تعبئة مختلفة بين المتغيرات</p>
        <p className="mt-1 text-xs text-muted-foreground">
          مثال: حليب صغير — الدرزن = 12 كرتون، حليب كبير — الدرزن = 6 كرتون. فعّل «تعبئة مخصصة»، اختر وحدات من الكتالogg، ثم احفظ عبر «تحديث المتغيرات» أو «حفظ التغييرات».
        </p>
      </div>

      <div className="space-y-4">
        {variants.map((variant, index) => {
          const hasCustom = variant.hasCustomUom === true;
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
                    onCheckedChange={(checked) => {
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
