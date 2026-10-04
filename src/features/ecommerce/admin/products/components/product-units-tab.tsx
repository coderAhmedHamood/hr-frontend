'use client';

import { type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { type ProductFormInput, type ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { ProductFormSection } from '@/features/ecommerce/admin/products/components/product-form-section';
import { ProductUomLinesEditor } from '@/features/ecommerce/admin/products/components/product-uom-lines-editor';

type Props = {
  control: Control<ProductFormInput, unknown, ProductFormValues>;
  errors: FieldErrors<ProductFormInput>;
  setValue: UseFormSetValue<ProductFormInput>;
};

export function ProductUnitsTab({ control, errors, setValue }: Props) {
  return (
    <div className="space-y-6">
      <ProductFormSection
        title="ربط الوحدات بالمنتج"
        description="اختياري — اربط وحدات من الكتالوج عند الحاجة. إن لم تضف شيئاً يُحفظ المنتج بدون وحدات قياس. بعد التعديل اضغط «حفظ التغييرات» في شريط أعلى الصفحة."
      >
        <ProductUomLinesEditor control={control} errors={errors} setValue={setValue} fieldPath="uomLines" />
      </ProductFormSection>
    </div>
  );
}
