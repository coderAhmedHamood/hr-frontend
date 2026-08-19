'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  ProductFormField,
  ProductFormSection,
} from '@/features/ecommerce/admin/products/components/product-form-section';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

export function ProductSettingsTab({ control, errors, register }: Props) {
  return (
    <div className="space-y-4">
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
