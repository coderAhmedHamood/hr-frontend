'use client';

import { Camera, CheckCircle2, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { useWatch, type Control, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { useProductImageField } from '@/features/ecommerce/admin/products/hooks/use-product-image-field';
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
}: Props) {
  const { imageUrl, pickImage, uploading } = useProductImageField(control, setValue);
  const sku = useWatch({ control, name: 'sku' }) ?? '';

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-linear-to-l from-muted/40 via-card to-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
          <button
            type="button"
            onClick={() => void pickImage()}
            disabled={uploading}
            className={cn(
              'group relative mx-auto flex aspect-square w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-background/80 transition-all hover:border-primary/50 hover:shadow-soft disabled:opacity-70 sm:mx-0 sm:w-40',
            )}
            aria-label="إضافة صورة المنتج"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : imageUrl ? (
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

      <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm font-medium text-foreground">
            المطلوب للحفظ: <span className="font-semibold">اسم المنتج فقط</span>
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          يُنشأ SKU تلقائيًا، ويمكن تخصيصه من تبويب «عام»
        </p>
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
