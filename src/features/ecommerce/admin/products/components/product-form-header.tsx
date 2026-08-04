'use client';

import type { ReactNode } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  ProductRelatedDocsBar,
  type ProductRelatedDocChip,
  type ProductRelatedDocKey,
} from '@/features/ecommerce/admin/products/components/product-related-docs-bar';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  nameError?: string;
  isEditing?: boolean;
  relatedDocs?: ProductRelatedDocChip[];
  relatedDocsActiveKey?: ProductRelatedDocKey | null;
  onRelatedDocSelect?: (key: ProductRelatedDocKey) => void;
  /** Extra row (back button, status badges, price/qty…) rendered above the image + name row, inside the same card. */
  topBar?: ReactNode;
};

export function ProductFormHeader({
  control,
  register,
  setValue,
  nameError,
  isEditing = false,
  relatedDocs,
  relatedDocsActiveKey,
  onRelatedDocSelect,
  topBar,
}: Props) {
  const { fields, append, update } = useFieldArray({ control, name: 'media' });
  const media = useWatch({ control, name: 'media' });
  const sku = useWatch({ control, name: 'sku' }) ?? '';
  const primary = media?.find((item) => item.isPrimary) ?? media?.[0];
  const imageUrl = primary?.url?.trim() ?? '';

  function pickImage() {
    const nextUrl = window.prompt('أدخل رابط صورة المنتج', imageUrl || 'https://');
    if (nextUrl === null) return;
    const url = nextUrl.trim();
    if (!url) return;

    if (fields.length === 0) {
      append({ url, alt: '', isPrimary: true });
      return;
    }

    const index = media?.findIndex((item) => item.isPrimary) ?? 0;
    const targetIndex = index >= 0 ? index : 0;
    const current = fields[targetIndex];
    if (!current) {
      append({ url, alt: '', isPrimary: true });
      return;
    }
    update(targetIndex, { ...current, url, isPrimary: true });
    fields.forEach((_, itemIndex) => {
      if (itemIndex !== targetIndex) {
        const item = fields[itemIndex];
        if (item) update(itemIndex, { ...item, isPrimary: false });
      }
    });
    setValue(`media.${targetIndex}.url`, url, { shouldDirty: true });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-linear-to-l from-muted/40 via-card to-card">
        {topBar ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-5">{topBar}</div>
        ) : null}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
          <button
            type="button"
            onClick={pickImage}
            className={cn(
              'group relative mx-auto flex aspect-square w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-background/80 transition-all hover:border-primary/50 hover:shadow-soft sm:mx-0 sm:w-40',
            )}
            aria-label="إضافة صورة المنتج"
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 px-3 text-center text-muted-foreground">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <Camera className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium">أضف صورة</span>
              </span>
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-foreground/70 py-1.5 text-[10px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
              <ImagePlus className="h-3 w-3" />
              تغيير
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
            <div className="space-y-1.5">
              <label htmlFor="product-name-ar" className="text-xs font-medium text-muted-foreground">
                اسم المنتج <span className="text-destructive">*</span>
              </label>
              <Input
                id="product-name-ar"
                placeholder="مثال: سيروم سيرافي المرطب 30 مل"
                className={cn(
                  'h-12 border-transparent bg-background/90 text-base font-semibold shadow-none focus-visible:border-primary focus-visible:ring-primary/20',
                  nameError && 'border-destructive focus-visible:ring-destructive',
                )}
                aria-invalid={Boolean(nameError)}
                {...register('nameAr')}
              />
              {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
              <p className="text-[11px] text-muted-foreground">
                الاسم العربي الظاهر في القوائم وصفحة المتجر.
              </p>
            </div>

            {sku ? (
              <p className="text-[11px] text-muted-foreground" dir="ltr">
                SKU: <span className="font-medium text-foreground">{sku}</span>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                ابدأ بالاسم والصورة — باقي التفاصيل في التبويبات بالأسفل.
              </p>
            )}
          </div>
        </div>
      </div>

      {relatedDocs && onRelatedDocSelect ? (
        <ProductRelatedDocsBar
          chips={relatedDocs}
          activeKey={relatedDocsActiveKey}
          onSelect={onRelatedDocSelect}
          defaultCollapsed={!isEditing}
          collapsedHint={isEditing ? 'عمليات المخزون لهذا المنتج' : 'عمليات المخزون (بعد الحفظ)'}
        />
      ) : null}
    </div>
  );
}
