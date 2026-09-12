'use client';

import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  ProductFormField,
  ProductFormSection,
} from '@/features/ecommerce/admin/products/components/product-form-section';
import { ProductImage } from '@/features/ecommerce/storefront/components/catalog/product-image';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

const ASPECT_RATIO_OPTIONS = [
  { value: 'square', label: 'مربع', hint: '1:1 — الأنسب لمعظم المنتجات' },
  { value: '4/3', label: 'أفقي (4:3)', hint: 'مناسب لصور المنتج بزاوية عريضة' },
  { value: '3/4', label: 'عمودي (3:4)', hint: 'مناسب لصور المنتج الطويلة' },
] as const;

const FIT_OPTIONS = [
  { value: 'contain', label: 'احتواء كامل الصورة', hint: 'تظهر الصورة كاملة دومًا — قد تترك فراغًا حول الحواف' },
  { value: 'cover', label: 'تعبئة وقص الحواف', hint: 'تملأ الصورة الصندوق بالكامل — قد تقص أطراف الصورة' },
] as const;

/** Live preview — renders the product's own primary image with the chosen
 * fit/aspect settings, at both the store-card size and the small thumbnail
 * size used in cart/orders, so what the merchant sees here is exactly what
 * shoppers will see everywhere. See test.md image-display note. */
function ProductImageDisplayPreview({ control }: { control: Control<ProductFormInput, unknown, ProductFormValues> }) {
  const media = useWatch({ control, name: 'media' }) ?? [];
  const fit = useWatch({ control, name: 'imageDisplayFit' }) ?? 'contain';
  const aspectRatio = useWatch({ control, name: 'imageDisplayAspectRatio' }) ?? 'square';
  const previewImage = media.find((item) => item.isPrimary) ?? media[0] ?? null;

  return (
    <div className="flex flex-wrap items-end gap-6 rounded-xl border border-dashed border-border bg-muted/20 p-4">
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">بطاقة المتجر</p>
        <ProductImage
          src={previewImage?.url ?? null}
          alt={previewImage?.alt || 'معاينة'}
          aspectRatio={aspectRatio}
          fit={fit}
          className="w-36 rounded-lg border border-border"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">مصغّرة (السلة/الطلبات)</p>
        <ProductImage
          src={previewImage?.url ?? null}
          alt={previewImage?.alt || 'معاينة'}
          aspectRatio={aspectRatio}
          fit={fit}
          className="w-16 rounded-lg border border-border"
        />
      </div>
      {!previewImage ? (
        <p className="text-xs text-muted-foreground">أضف صورة للمنتج من الأعلى لمعاينة العرض.</p>
      ) : null}
    </div>
  );
}

export function ProductSettingsTab({ control, errors, register }: Props) {
  return (
    <div className="space-y-4">
      <ProductFormSection
        title="عرض الصورة بالمتجر"
        description="اضبط كيف تظهر صور هذا المنتج في كل مكان بالمتجر (البطاقات، المعرض، السلة، الطلبات) — نفس الإعداد يُطبَّق في كل مكان."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductFormField label="نسبة العرض" htmlFor="product-image-aspect-ratio">
            <Controller
              control={control}
              name="imageDisplayAspectRatio"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="product-image-aspect-ratio" aria-label="نسبة العرض">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </ProductFormField>
          <ProductFormField label="طريقة الملء" htmlFor="product-image-fit">
            <Controller
              control={control}
              name="imageDisplayFit"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="product-image-fit" aria-label="طريقة الملء">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </ProductFormField>
        </div>
        <p className="text-[11px] text-muted-foreground">
          مربع = 1:1 · أفقي = 4:3 · عمودي = 3:4 — واحتواء = الصورة كاملة دومًا · تعبئة = تملأ الصندوق وقد تقص الحواف
        </p>
        <ProductImageDisplayPreview control={control} />
      </ProductFormSection>

      <ProductFormSection
        title="العروض والترويج"
        description="فعّل الخيارات حسب الحاجة. التواريخ اختيارية — اتركها فارغة ليستمر العرض بلا انتهاء."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Controller
            control={control}
            name="isNewProduct"
            render={({ field }) => (
              <div
                className={cn(
                  'rounded-xl border p-3 transition-colors',
                  field.value ? 'border-primary/30 bg-primary/5' : 'border-border bg-background',
                )}
              >
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">منتج حديث</span>
                    <span className="block text-[11px] text-muted-foreground">
                      يظهر ضمن فلتر المنتجات الحديثة
                    </span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="منتج حديث"
                  />
                </label>
                {field.value ? (
                  <div className="mt-3">
                    <ProductFormField
                      label="يستمر كمنتج حديث حتى"
                      htmlFor="product-new-until"
                      hint="اختياري — فارغ = بدون انتهاء"
                    >
                      <Controller
                        control={control}
                        name="newUntil"
                        render={({ field: dateField }) => (
                          <DatePickerInput
                            id="product-new-until"
                            value={dateField.value ?? ''}
                            onChange={dateField.onChange}
                            placeholder="بدون تاريخ انتهاء"
                          />
                        )}
                      />
                    </ProductFormField>
                  </div>
                ) : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="isTodayDeal"
            render={({ field }) => (
              <div
                className={cn(
                  'rounded-xl border p-3 transition-colors',
                  field.value ? 'border-primary/30 bg-primary/5' : 'border-border bg-background',
                )}
              >
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">تخفيضات اليوم</span>
                    <span className="block text-[11px] text-muted-foreground">
                      سعر التخفيض بجانب السعر الأساسي — والتاريخ اختياري
                    </span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="تخفيضات اليوم"
                  />
                </label>
                {field.value ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <ProductFormField
                      label="سعر التخفيض"
                      htmlFor="product-deal-price"
                      error={errors.dealPriceAmount?.message}
                      required
                      hint="السعر الأساسي يبقى سعر البيع أعلاه"
                    >
                      <div className="relative">
                        <Input
                          id="product-deal-price"
                          type="number"
                          min={0}
                          step="0.01"
                          dir="rtl"
                          className="h-11 pe-12"
                          {...register('dealPriceAmount')}
                        />
                        <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
                          ر.ي
                        </span>
                      </div>
                    </ProductFormField>
                    <ProductFormField
                      label="مدة التخفيض (أيام)"
                      htmlFor="product-deal-days"
                      hint="اختياري — يُحسب تاريخ النهاية تلقائيًا"
                    >
                      <Input
                        id="product-deal-days"
                        type="number"
                        min={1}
                        step={1}
                        dir="rtl"
                        placeholder="اختياري"
                        className="h-11"
                        {...register('dealDays')}
                      />
                    </ProductFormField>
                    <ProductFormField
                      label="ينتهي في"
                      htmlFor="product-deal-until"
                      hint="اختياري — فارغ = بدون انتهاء"
                    >
                      <Controller
                        control={control}
                        name="dealUntil"
                        render={({ field: dateField }) => (
                          <DatePickerInput
                            id="product-deal-until"
                            value={dateField.value ?? ''}
                            onChange={dateField.onChange}
                            placeholder="بدون تاريخ انتهاء"
                          />
                        )}
                      />
                    </ProductFormField>
                  </div>
                ) : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="isWholesale"
            render={({ field }) => (
              <div
                className={cn(
                  'rounded-xl border p-3 transition-colors',
                  field.value ? 'border-primary/30 bg-primary/5' : 'border-border bg-background',
                )}
              >
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">أسعار جملة</span>
                    <span className="block text-[11px] text-muted-foreground">
                      سعر الجملة بجانب السعر الأساسي — والتاريخ اختياري
                    </span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="أسعار جملة"
                  />
                </label>
                {field.value ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ProductFormField
                      label="سعر الجملة"
                      htmlFor="product-wholesale-price"
                      error={errors.wholesalePriceAmount?.message}
                      required
                    >
                      <div className="relative">
                        <Input
                          id="product-wholesale-price"
                          type="number"
                          min={0}
                          step="0.01"
                          dir="rtl"
                          className="h-11 pe-12"
                          {...register('wholesalePriceAmount')}
                        />
                        <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
                          ر.ي
                        </span>
                      </div>
                    </ProductFormField>
                    <ProductFormField
                      label="ينتهي في"
                      htmlFor="product-wholesale-until"
                      hint="اختياري — فارغ = بدون انتهاء"
                    >
                      <Controller
                        control={control}
                        name="wholesaleUntil"
                        render={({ field: dateField }) => (
                          <DatePickerInput
                            id="product-wholesale-until"
                            value={dateField.value ?? ''}
                            onChange={dateField.onChange}
                            placeholder="بدون تاريخ انتهاء"
                          />
                        )}
                      />
                    </ProductFormField>
                  </div>
                ) : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="isDiscounted"
            render={({ field }) => (
              <div
                className={cn(
                  'rounded-xl border p-3 transition-colors',
                  field.value ? 'border-primary/30 bg-primary/5' : 'border-border bg-background',
                )}
              >
                <label className="flex cursor-pointer items-start justify-between gap-3">
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">خصومات</span>
                    <span className="block text-[11px] text-muted-foreground">
                      نسبة الخصم وتاريخ انتهائه (اختياري)
                    </span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="خصومات"
                  />
                </label>
                {field.value ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ProductFormField
                      label="نسبة الخصم %"
                      htmlFor="product-discount-percent"
                      error={errors.discountPercent?.message}
                      required
                    >
                      <Input
                        id="product-discount-percent"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        dir="rtl"
                        className="h-11"
                        {...register('discountPercent')}
                      />
                    </ProductFormField>
                    <ProductFormField
                      label="ينتهي الخصم في"
                      htmlFor="product-discount-until"
                      hint="اختياري — فارغ = بدون انتهاء"
                    >
                      <Controller
                        control={control}
                        name="discountUntil"
                        render={({ field: dateField }) => (
                          <DatePickerInput
                            id="product-discount-until"
                            value={dateField.value ?? ''}
                            onChange={dateField.onChange}
                            placeholder="بدون تاريخ انتهاء"
                          />
                        )}
                      />
                    </ProductFormField>
                  </div>
                ) : null}
              </div>
            )}
          />
        </div>
      </ProductFormSection>

      <ProductFormSection title="قنوات البيع" description="أين يظهر المنتج ويُباع.">
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              {
                name: 'saleOk' as const,
                title: 'متاح للبيع',
                hint: 'يظهر في المتجر وقنوات البيع',
              },
              {
                name: 'purchaseOk' as const,
                title: 'متاح للشراء',
                hint: 'يمكن تموينه من الموردين',
              },
              {
                name: 'posAvailable' as const,
                title: 'نقطة البيع',
                hint: 'متاح في شاشة الكاشير',
              },
            ] as const
          ).map((item) => (
            <Controller
              key={item.name}
              control={control}
              name={item.name}
              render={({ field }) => (
                <label
                  className={cn(
                    'flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 transition-colors',
                    field.value ? 'border-primary/30 bg-primary/5' : 'border-border bg-background',
                  )}
                >
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block text-[11px] text-muted-foreground">{item.hint}</span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label={item.title}
                  />
                </label>
              )}
            />
          ))}
        </div>
      </ProductFormSection>

      <ProductFormSection title="المخزون" description="كيف يتحرك مخزون هذا المنتج عند البيع.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                name: 'trackInventory' as const,
                title: 'تتبع المخزون',
                hint: 'خصم الكمية عند البيع من مخزون المستودع',
              },
              {
                name: 'allowBackorder' as const,
                title: 'الطلب عند النفاد',
                hint: 'السماح بالبيع رغم نفاد المخزون',
              },
            ] as const
          ).map((item) => (
            <Controller
              key={item.name}
              control={control}
              name={item.name}
              render={({ field }) => (
                <label
                  className={cn(
                    'flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 transition-colors',
                    field.value ? 'border-primary/30 bg-primary/5' : 'border-border bg-background',
                  )}
                >
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block text-[11px] text-muted-foreground">{item.hint}</span>
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label={item.title}
                  />
                </label>
              )}
            />
          ))}
        </div>
      </ProductFormSection>
    </div>
  );
}
