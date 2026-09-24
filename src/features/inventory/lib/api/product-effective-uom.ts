import { apiRequest } from '@/features/hr/lib/api/client';

export type EffectiveUomLine = {
  id: string;
  nameAr: string;
  relativeQuantity: string | number;
  isReference: boolean;
  packagingType: string;
  catalogUomId?: string | null;
  source: 'product' | 'variant';
};

export async function fetchEffectiveUomLines(
  productId: string,
  variantId?: string,
): Promise<EffectiveUomLine[]> {
  const params = variantId ? `?variantId=${encodeURIComponent(variantId)}` : '';
  return apiRequest<EffectiveUomLine[]>(
    `/inventory/products/${productId}/effective-uom-lines${params}`,
  );
}
