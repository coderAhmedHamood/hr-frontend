'use client';

import * as React from 'react';
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useProductOnHand, useProductStockSummary } from '@/features/inventory/admin/hooks/use-product-on-hand';
import { STOCK_STATUS_OPTIONS, type ProductFormInput, type ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  ProductFormField,
  ProductFormSection,
} from '@/features/ecommerce/admin/products/components/product-form-section';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  productId?: string | null;
};

export function ProductInventoryTab({ control, errors, register, setValue, productId }: Props) {
  const companyId = getStorefrontCompanyId();
  const variants = useWatch({ control, name: 'variants' }) ?? [];
  const hasVariants = variants.length > 0;
  const { data: onHand, isLoading } = useProductOnHand(companyId, productId ?? undefined);
  const { data: summary } = useProductStockSummary(companyId, productId ?? undefined);

  const warehouseQty = onHand?.total ?? 0;

  React.useEffect(() => {
    if (!productId || onHand == null) return;
    setValue('stockQuantity', onHand.total, { shouldDirty: false });
  }, [productId, onHand, setValue]);

  const variantIdsKey = variants.map((variant) => variant.id).join('|');

  React.useEffect(() => {
    if (!productId || onHand == null || !hasVariants) return;
    variants.forEach((variant, index) => {
      const qty = onHand.byVariant[variant.id] ?? 0;
      setValue(`variants.${index}.quantity`, qty, { shouldDirty: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when warehouse totals or variant ids change
  }, [productId, onHand, hasVariants, variantIdsKey, setValue]);

  return (
    <div className="space-y-4">
      <ProductFormSection
        title="رصيد المخزون"
        description={
          productId
            ? 'مصدر الحقيقة هو مخزون المواقع. الأرقام هنا للعرض بعد تصديق الحركات.'
            : 'احفظ المنتج أولًا ثم صدّق مستندات الاستلام لتظهر الكميات هنا.'
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground">المتاح فعليًا (On Hand)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight" dir="ltr">
              {productId ? (isLoading ? '…' : warehouseQty) : 0}
            </p>
          </div>
          {productId && summary ? (
            <>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">محجوز (Reserved)</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight" dir="ltr">
                  {summary.reserved}
                </p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-[11px] text-muted-foreground">قابل للبيع (Available)</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-primary" dir="ltr">
                  {summary.available}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </ProductFormSection>

      <ProductFormSection title="إعدادات التوفر" description="حالة العرض وتنبيهات النفاد.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProductFormField label="حالة التوفر" htmlFor="product-availability">
            <Controller
              control={control}
              name="stockStatus"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="product-availability" aria-label="حالة التوفر" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.labelAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </ProductFormField>

          <ProductFormField
            label="حد المخزون المنخفض"
            htmlFor="product-low-stock"
            error={errors.lowStockThreshold?.message}
            hint="تنبيه عندما يصل الرصيد إلى هذا الحد أو دونه."
          >
            <Input
              id="product-low-stock"
              type="number"
              min={0}
              step={1}
              dir="ltr"
              className="h-11 max-w-[10rem]"
              {...register('lowStockThreshold', { valueAsNumber: true })}
            />
          </ProductFormField>
        </div>

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
