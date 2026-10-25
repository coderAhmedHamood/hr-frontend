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
import type { ProductFormInput, ProductFormValues } from '@/features/catalog/products/schemas/product-schema';
import { ProductFormField } from '@/features/catalog/products/components/product-form-section';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';
import { localYmd } from '@/features/catalog/products/lib/product-form-mapping';
import { useProductAppSections } from '@/features/catalog/products/hooks/use-product-app-sections';

/**
 * One offer per product (approved 2026-10-20): a fixed price, a percent of
 * the selling price, or an amount off it — never off the purchase cost. A
 * fixed price shows in «تخفيضات اليوم» and «خصومات»; a percent or an amount
 * in «خصومات», and in «تخفيضات اليوم» too when marked. One end date; quick
 * buttons fill it.
 */
type OfferKind = 'none' | 'price' | 'percent' | 'amount';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  currencySymbol: string;
};

const KINDS: Array<{ value: OfferKind; label: string }> = [
  { value: 'none', label: 'بدون عرض' },
  { value: 'price', label: 'سعر محدد' },
  { value: 'percent', label: 'نسبة من سعر البيع' },
  { value: 'amount', label: 'مبلغ من سعر البيع' },
];

const QUICK_ENDS: Array<{ label: string; days: number }> = [
  { label: 'اليوم فقط', days: 0 },
  { label: '3 أيام', days: 3 },
  { label: 'أسبوع', days: 7 },
  { label: 'شهر', days: 30 },
];

function dayAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localYmd(date);
}

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function ProductOfferCard({ control, errors, register, setValue, currencySymbol }: Props) {
  const isTodayDeal = useWatch({ control, name: 'isTodayDeal' });
  const isDiscounted = useWatch({ control, name: 'isDiscounted' });
  const dealPrice = useWatch({ control, name: 'dealPriceAmount' });
  const percent = useWatch({ control, name: 'discountPercent' });
  const amount = useWatch({ control, name: 'discountAmount' });
  const listPrice = num(useWatch({ control, name: 'listPrice' }));
  // The purchase cost is inventory's: no loss warning without it.
  const { inventory } = useProductAppSections();
  const watchedCost = num(useWatch({ control, name: 'costPrice' }));
  const costPrice = inventory ? watchedCost : 0;
  const dealUntil = useWatch({ control, name: 'dealUntil' });
  const discountUntil = useWatch({ control, name: 'discountUntil' });

  // The kind follows the saved values, then the user's choice.
  const [kind, setKind] = React.useState<OfferKind>(() =>
    isTodayDeal ? 'price' : isDiscounted ? (num(amount) > 0 ? 'amount' : 'percent') : 'none',
  );

  const endField = kind === 'price' ? 'dealUntil' : 'discountUntil';
  const endValue = (kind === 'price' ? dealUntil : discountUntil) ?? '';

  function chooseKind(next: OfferKind) {
    const end = endValue;
    setKind(next);
    const dirty = { shouldDirty: true } as const;
    setValue('isTodayDeal', next === 'price', dirty);
    setValue('isDiscounted', next === 'percent' || next === 'amount', dirty);
    if (next !== 'price') setValue('dealPriceAmount', undefined, dirty);
    if (next !== 'percent') setValue('discountPercent', undefined, dirty);
    if (next !== 'amount') setValue('discountAmount', undefined, dirty);
    if (next !== 'percent' && next !== 'amount') setValue('inTodayDeals', false, dirty);
    // The end date moves with the offer.
    setValue('dealUntil', next === 'price' ? end : '', dirty);
    setValue('discountUntil', next === 'percent' || next === 'amount' ? end : '', dirty);
  }

  const finalPrice =
    kind === 'price'
      ? num(dealPrice)
      : kind === 'percent'
        ? Math.round(listPrice * (1 - num(percent) / 100) * 100) / 100
        : kind === 'amount'
          ? Math.round((listPrice - num(amount)) * 100) / 100
          : listPrice;
  const hasValue =
    (kind === 'price' && num(dealPrice) > 0) ||
    (kind === 'percent' && num(percent) > 0) ||
    (kind === 'amount' && num(amount) > 0);
  const saving = Math.round((listPrice - finalPrice) * 100) / 100;

  const valueField =
    kind === 'price' ? (
      <ProductFormField label="سعر العرض" htmlFor="product-offer-price" error={errors.dealPriceAmount?.message} required>
        <div className="relative">
          <Input id="product-offer-price" type="number" min={0} step="0.01" dir="rtl" className="h-11 pe-12" {...register('dealPriceAmount')} />
          <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">{currencySymbol}</span>
        </div>
      </ProductFormField>
    ) : kind === 'percent' ? (
      <ProductFormField label="النسبة من سعر البيع" htmlFor="product-offer-percent" error={errors.discountPercent?.message} required>
        <div className="relative">
          <Input id="product-offer-percent" type="number" min={0} max={99} step="0.01" dir="rtl" className="h-11 pe-8" {...register('discountPercent')} />
          <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">%</span>
        </div>
      </ProductFormField>
    ) : kind === 'amount' ? (
      <ProductFormField label="المبلغ من سعر البيع" htmlFor="product-offer-amount" error={errors.discountAmount?.message} required>
        <div className="relative">
          <Input id="product-offer-amount" type="number" min={0} step="0.01" dir="rtl" className="h-11 pe-12" {...register('discountAmount')} />
          <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">{currencySymbol}</span>
        </div>
      </ProductFormField>
    ) : null;

  return (
    <div className={cn('rounded-xl border p-3 transition-colors', kind !== 'none' ? 'border-primary/30 bg-primary/5' : 'border-border bg-background')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ProductFormField label="العرض" htmlFor="product-offer-kind">
          <Select value={kind} onValueChange={(v) => chooseKind(v as OfferKind)}>
            <SelectTrigger id="product-offer-kind" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ProductFormField>
        {valueField}
      </div>

      {kind !== 'none' ? (
        <div className="mt-3 space-y-3">
          <ProductFormField label="ينتهي في" htmlFor="product-offer-until" hint="يشمل اليوم كاملًا · فارغ = بدون انتهاء">
            <div className="space-y-2">
              <Controller
                control={control}
                name={endField}
                render={({ field }) => (
                  <DatePickerInput id="product-offer-until" value={field.value ?? ''} onChange={field.onChange} placeholder="بدون تاريخ انتهاء" />
                )}
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ENDS.map((q) => (
                  <Button
                    key={q.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setValue(endField, dayAfter(q.days), { shouldDirty: true })}
                  >
                    {q.label}
                  </Button>
                ))}
              </div>
            </div>
          </ProductFormField>

          {kind === 'percent' || kind === 'amount' ? (
            <Controller
              control={control}
              name="inTodayDeals"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-background/70 px-3 py-2">
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">يظهر في «تخفيضات اليوم»</span>
                    <span className="block text-[11px] text-muted-foreground">
                      إضافةً إلى «خصومات»، بنفس الخصم وتاريخ الانتهاء
                    </span>
                  </span>
                  <Switch
                    checked={field.value === true}
                    onCheckedChange={field.onChange}
                    aria-label="يظهر في تخفيضات اليوم"
                  />
                </label>
              )}
            />
          ) : null}

          {hasValue && listPrice > 0 ? (
            <p className="rounded-lg bg-background/70 px-3 py-2 text-sm">
              سعر البيع {money(listPrice)} {currencySymbol} ← بعد العرض{' '}
              <span className="font-bold text-primary">
                {money(finalPrice)} {currencySymbol}
              </span>
              {saving > 0 ? (
                <span className="text-muted-foreground">
                  {' '}
                  (توفير {money(saving)} {currencySymbol})
                </span>
              ) : null}
            </p>
          ) : null}
          {hasValue && costPrice > 0 && finalPrice < costPrice ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200">
              السعر بعد العرض ({money(finalPrice)}) أقل من تكلفة الشراء ({money(costPrice)}) — ستبيع بخسارة.
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            {kind === 'price' ? 'يظهر في «تخفيضات اليوم» و«خصومات».' : 'يظهر في «خصومات».'} النسبة والمبلغ من سعر البيع، لا من تكلفة الشراء.
          </p>
        </div>
      ) : null}
    </div>
  );
}
