'use client';

import { Camera, Plus } from 'lucide-react';
import { useFieldArray, useWatch, type Control, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  ProductRelatedDocsBar,
  type ProductRelatedDocChip,
  type ProductRelatedDocKey,
} from '@/features/ecommerce/admin/products/components/product-related-docs-bar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils';

type Props = {
  control: Control<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
  nameError?: string;
  relatedDocs?: ProductRelatedDocChip[];
  relatedDocsActiveKey?: ProductRelatedDocKey | null;
  onRelatedDocSelect?: (key: ProductRelatedDocKey) => void;
};

export function ProductFormHeader({
  control,
  register,
  setValue,
  nameError,
  relatedDocs,
  relatedDocsActiveKey,
  onRelatedDocSelect,
}: Props) {
  const { fields, append, update } = useFieldArray({ control, name: 'media' });
  const media = useWatch({ control, name: 'media' });
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
    <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:gap-6">
      <button
        type="button"
        onClick={pickImage}
        className={cn(
          'group relative mx-auto flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/40 hover:bg-muted/70 lg:mx-0',
        )}
        aria-label="إضافة صورة المنتج"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-muted-foreground">
            <span className="relative">
              <Camera className="h-8 w-8" />
              <Plus className="absolute -end-2 -top-1 h-4 w-4 rounded-full bg-background text-foreground shadow-soft" />
            </span>
            <span className="text-xs">صورة المنتج</span>
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1.5">
          <Input
            id="product-name-ar"
            placeholder="مثال: شطيرة برجر بالجبنة"
            className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
            {...register('nameAr')}
          />
          {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
        </div>

        <Label htmlFor="product-name-ar" className="sr-only">
          اسم المنتج
        </Label>
      </div>

      {relatedDocs && onRelatedDocSelect ? (
        <ProductRelatedDocsBar
          className="shrink-0 justify-center lg:justify-end"
          chips={relatedDocs}
          activeKey={relatedDocsActiveKey}
          onSelect={onRelatedDocSelect}
        />
      ) : null}
    </div>
  );
}
