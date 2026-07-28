'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import {
  PRODUCT_INVOICE_POLICY_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  PRODUCT_TRACKING_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  type ProductFormInput,
} from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  ProductFormField,
  ProductFormSection,
} from '@/features/ecommerce/admin/products/components/product-form-section';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

const NO_VALUE = '__none__';

type Props = {
  control: Control<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  categories: Category[] | undefined;
  brands: Brand[] | undefined;
};

export function ProductGeneralTab({ control, errors, register, categories, brands }: Props) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className="space-y-4">
      <ProductFormSection
        title="الأساسيات"
        description="ما يحتاجه المنتج ليظهر ويُعرَّف في المخزون والمتجر."
      >
        <ProductFormField label="نوع المنتج">
          <Controller
            control={control}
            name="productType"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="نوع المنتج">
                {PRODUCT_TYPE_OPTIONS.map((option) => {
                  const selected = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-sm transition-all',
                        selected
                          ? 'border-primary bg-primary/10 font-semibold text-primary shadow-soft'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
                      )}
                    >
                      {option.labelAr}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </ProductFormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProductFormField
            label="رمز المنتج (SKU)"
            htmlFor="product-sku"
            required
            error={errors.sku?.message}
            hint="رمز فريد داخل الشركة — مثال: SKN-001"
          >
            <Input
              id="product-sku"
              dir="ltr"
              placeholder="SKN-001"
              className="h-11"
              {...register('sku')}
            />
          </ProductFormField>

          <ProductFormField label="الحالة" htmlFor="product-status">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="product-status" aria-label="الحالة" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.labelAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </ProductFormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProductFormField label="الفئة" htmlFor="product-category">
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value ?? NO_VALUE}
                  onValueChange={(value) => field.onChange(value === NO_VALUE ? undefined : value)}
                >
                  <SelectTrigger id="product-category" aria-label="الفئة" className="h-11">
                    <SelectValue placeholder="اختر فئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VALUE}>بدون فئة</SelectItem>
                    {(categories ?? []).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </ProductFormField>

          <ProductFormField label="العلامة التجارية" htmlFor="product-brand">
            <Controller
              control={control}
              name="brandId"
              render={({ field }) => (
                <Select
                  value={field.value ?? NO_VALUE}
                  onValueChange={(value) => field.onChange(value === NO_VALUE ? undefined : value)}
                >
                  <SelectTrigger id="product-brand" aria-label="العلامة التجارية" className="h-11">
                    <SelectValue placeholder="بدون علامة تجارية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_VALUE}>بدون علامة تجارية</SelectItem>
                    {(brands ?? []).map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </ProductFormField>
        </div>
      </ProductFormSection>

      <ProductFormSection title="التسعير" description="أسعار البيع والشراء بالريال اليمني.">
        <div className="grid gap-4 sm:grid-cols-3">
          <ProductFormField
            label="سعر البيع"
            htmlFor="product-list-price"
            error={errors.listPrice?.message}
          >
            <div className="relative">
              <Input
                id="product-list-price"
                type="number"
                min={0}
                step="0.01"
                dir="ltr"
                className="h-11 pe-12"
                {...register('listPrice')}
              />
              <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
                ر.ي
              </span>
            </div>
          </ProductFormField>

          <ProductFormField
            label="سعر الشراء"
            htmlFor="product-cost-price"
            error={errors.costPrice?.message}
          >
            <div className="relative">
              <Input
                id="product-cost-price"
                type="number"
                min={0}
                step="0.01"
                dir="ltr"
                className="h-11 pe-12"
                {...register('costPrice')}
              />
              <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
                ر.ي
              </span>
            </div>
          </ProductFormField>

          <ProductFormField
            label="سعر المقارنة"
            htmlFor="product-compare-at"
            hint="يظهر كسعر قبل الخصم في المتجر."
          >
            <div className="relative">
              <Input
                id="product-compare-at"
                type="number"
                min={0}
                step="0.01"
                dir="ltr"
                placeholder="اختياري"
                className="h-11 pe-12"
                {...register('compareAtPrice')}
              />
              <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
                ر.ي
              </span>
            </div>
          </ProductFormField>
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

      <ProductFormSection title="الوصف" description="نصوص العرض في بطاقة المنتج والصفحة.">
        <ProductFormField
          label="وصف مختصر"
          htmlFor="product-short-description"
          hint="يظهر في بطاقات القوائم."
        >
          <Textarea
            id="product-short-description"
            rows={2}
            className="resize-none"
            {...register('shortDescription')}
          />
        </ProductFormField>
        <ProductFormField label="الوصف الكامل" htmlFor="product-description">
          <Textarea
            id="product-description"
            rows={4}
            className="resize-none"
            {...register('description')}
          />
        </ProductFormField>
      </ProductFormSection>

      <div className="overflow-hidden rounded-2xl border border-border/80">
        <button
          type="button"
          onClick={() => setShowAdvanced((value) => !value)}
          className="flex w-full items-center justify-between gap-3 bg-muted/20 px-4 py-3 text-start transition-colors hover:bg-muted/35 sm:px-5"
          aria-expanded={showAdvanced}
        >
          <div>
            <p className="text-sm font-semibold text-foreground">تفاصيل إضافية</p>
            <p className="text-[11px] text-muted-foreground">
              فوترة، تتبع، باركود، علامات، وأبعاد الشحن — اختيارية.
            </p>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              showAdvanced && 'rotate-180',
            )}
          />
        </button>

        {showAdvanced ? (
          <div className="space-y-4 border-t border-border/70 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <ProductFormField label="سياسة الفوترة" htmlFor="product-invoice-policy">
                <Controller
                  control={control}
                  name="invoicePolicy"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="product-invoice-policy" aria-label="سياسة الفوترة" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_INVOICE_POLICY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.labelAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </ProductFormField>

              <ProductFormField label="التتبع" htmlFor="product-tracking">
                <Controller
                  control={control}
                  name="tracking"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="product-tracking" aria-label="التتبع" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TRACKING_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.labelAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </ProductFormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ProductFormField label="الباركود" htmlFor="product-barcode">
                <Input
                  id="product-barcode"
                  dir="ltr"
                  placeholder="6281000000000"
                  className="h-11"
                  {...register('barcode')}
                />
              </ProductFormField>

              <ProductFormField
                label="علامات التصنيف"
                htmlFor="product-tags"
                hint="مفصولة بفواصل — مثال: best-seller، deals"
              >
                <Input
                  id="product-tags"
                  className="h-11"
                  placeholder="best-seller, deals"
                  {...register('tagsInput')}
                />
              </ProductFormField>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">أبعاد الشحن (اختياري)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ProductFormField label="الوزن (كجم)" htmlFor="product-weight">
                  <Input
                    id="product-weight"
                    type="number"
                    min={0}
                    step="0.01"
                    dir="ltr"
                    className="h-11"
                    {...register('weightKg')}
                  />
                </ProductFormField>
                <ProductFormField label="الطول (سم)" htmlFor="product-length">
                  <Input
                    id="product-length"
                    type="number"
                    min={0}
                    step="0.1"
                    dir="ltr"
                    className="h-11"
                    {...register('lengthCm')}
                  />
                </ProductFormField>
                <ProductFormField label="العرض (سم)" htmlFor="product-width">
                  <Input
                    id="product-width"
                    type="number"
                    min={0}
                    step="0.1"
                    dir="ltr"
                    className="h-11"
                    {...register('widthCm')}
                  />
                </ProductFormField>
                <ProductFormField label="الارتفاع (سم)" htmlFor="product-height">
                  <Input
                    id="product-height"
                    type="number"
                    min={0}
                    step="0.1"
                    dir="ltr"
                    className="h-11"
                    {...register('heightCm')}
                  />
                </ProductFormField>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
