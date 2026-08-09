import * as React from 'react';
import { useFieldArray, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import type { ProductFormInput, ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';
import { pickAndUploadProductImage } from '@/features/ecommerce/admin/products/lib/pick-product-image';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';

/** Shared primary-image read/write logic for the product form header and detail hero. */
export function useProductImageField(
  control: Control<ProductFormInput, unknown, ProductFormValues>,
  setValue: UseFormSetValue<ProductFormInput>,
) {
  const { fields, append, update } = useFieldArray({ control, name: 'media' });
  const media = useWatch({ control, name: 'media' });
  const primary = media?.find((item) => item.isPrimary) ?? media?.[0];
  const imageUrl = primary?.url?.trim() ?? '';
  const [uploading, setUploading] = React.useState(false);

  async function pickImage() {
    setUploading(true);
    const url = await pickAndUploadProductImage();
    setUploading(false);
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

  return { imageUrl: resolveUploadUrl(imageUrl), pickImage, uploading };
}
