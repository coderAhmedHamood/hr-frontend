'use client';

import {
  Controller,
  useWatch,
  type Control,
} from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/catalog/products/schemas/product-schema';
import {
  ProductFormField,
  ProductFormSection,
} from '@/features/catalog/products/components/product-form-section';
import { ProductImage } from '@/features/ecommerce/storefront/components/catalog/product-image';
import { ProductMediaGallery } from '@/features/ecommerce/storefront/components/catalog/product-media-gallery';
import type { MediaItem } from '@/features/ecommerce/domain/types/common';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
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

/** The store product page and the store card, using this product's own photos. */
function ProductImageDisplayPreview({ control }: { control: Control<ProductFormInput, unknown, ProductFormValues> }) {
  const media = useWatch({ control, name: 'media' }) ?? [];
  const nameAr = useWatch({ control, name: 'nameAr' }) ?? '';
  const fit = useWatch({ control, name: 'imageDisplayFit' }) ?? 'contain';
  const aspectRatio = useWatch({ control, name: 'imageDisplayAspectRatio' }) ?? 'square';
  const images: MediaItem[] = media
    .filter((item) => item.url?.trim())
    .map((item, index) => ({
      id: `preview-${index}`,
      url: resolveUploadUrl(item.url),
      alt: item.alt?.trim() || nameAr || 'صورة المنتج',
      type: 'image' as const,
      position: index,
      isPrimary: item.isPrimary,
    }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const primary = images[0] ?? null;

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
      <div className="grid items-start gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">صفحة المنتج</p>
          <ProductMediaGallery
            images={images}
            fallbackAlt={primary?.alt || nameAr || 'صورة المنتج'}
            aspectRatio={aspectRatio}
            fit={fit}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">بطاقة المتجر</p>
          <div className="w-full max-w-[220px] overflow-hidden rounded-lg border border-border bg-card">
            <ProductImage
              src={primary?.url ?? null}
              alt={primary?.alt || 'صورة المنتج'}
              aspectRatio={aspectRatio}
              fit={fit}
              className="bg-muted/20"
              sizes="220px"
            />
          </div>
        </div>
      </div>
      {images.length === 0 ? (
        <p className="text-xs text-muted-foreground">أضف صورة للمنتج من الأعلى لمعاينة العرض كما يظهر في المتجر.</p>
      ) : null}
    </div>
  );
}

/** Store image display (store-admin). Hidden when the store app is off. */
export function ProductImageTab({ control }: Props) {
  return (
    <ProductFormSection
      title="عرض الصورة بالمتجر"
      description="اضبط كيف تظهر صور هذا المنتج في كل مكان بالمتجر (البطاقات، المعرض، السلة، الطلبات) — نفس الإعداد يُطبَّق في كل مكان."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
  );
}
