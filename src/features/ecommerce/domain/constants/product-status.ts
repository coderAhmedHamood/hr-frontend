export type ProductStatus = 'draft' | 'active' | 'archived';

export const PRODUCT_STATUS_LABELS_AR: Record<ProductStatus, string> = {
  draft: 'مسودة',
  active: 'نشط',
  archived: 'مؤرشف',
};

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; labelAr: string }[] = (
  Object.entries(PRODUCT_STATUS_LABELS_AR) as [ProductStatus, string][]
).map(([value, labelAr]) => ({ value, labelAr }));
