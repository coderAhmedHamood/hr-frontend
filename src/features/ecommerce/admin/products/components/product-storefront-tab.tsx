'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProductFormInput } from '@/features/ecommerce/admin/products/schemas/product-schema';
import {
  ProductFormField,
  ProductFormSection,
} from '@/features/ecommerce/admin/products/components/product-form-section';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  errors: FieldErrors<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
};

/** Storefront presentation / SEO. */
export function ProductStorefrontTab({ errors, register }: Props) {
  return (
    <div className="space-y-4">
      <ProductFormSection
        title="عرض المتجر"
        description="الاسم الإنجليزي والرابط المختصر لصفحة المنتج."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ProductFormField label="الاسم الإنجليزي" htmlFor="product-name-en">
            <Input id="product-name-en" className="h-11" dir="ltr" {...register('nameEn')} />
          </ProductFormField>

          <ProductFormField
            label="الرابط المختصر (Slug)"
            htmlFor="product-slug"
            error={errors.slug?.message}
            hint="أحرف إنجليزية صغيرة وأرقام وشرطات فقط. يُولَّد تلقائيًا إن تُرك فارغًا."
          >
            <Input
              id="product-slug"
              dir="ltr"
              className="h-11"
              placeholder="cerave-hydrating-serum"
              {...register('slug')}
            />
          </ProductFormField>
        </div>
      </ProductFormSection>

      <ProductFormSection title="تحسين محركات البحث (SEO)" description="اختياري — يحسّن ظهور المنتج في البحث.">
        <ProductFormField label="عنوان SEO" htmlFor="product-meta-title">
          <Input id="product-meta-title" className="h-11" {...register('metaTitle')} />
        </ProductFormField>
        <ProductFormField label="وصف SEO" htmlFor="product-meta-description">
          <Textarea
            id="product-meta-description"
            rows={3}
            className="resize-none"
            {...register('metaDescription')}
          />
        </ProductFormField>
      </ProductFormSection>
    </div>
  );
}
