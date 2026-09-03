'use client';

import { useProduct } from '@/features/ecommerce/admin/products/hooks/use-products';

type Props = {
  companyId: string;
  productId: string;
  fallback?: string;
};

/** Resolves a product display name on demand (cached via React Query). */
export function ProductLabel({ companyId, productId, fallback }: Props) {
  const { data: product } = useProduct(companyId, productId);
  const label = product?.nameAr?.trim() || product?.sku?.trim();
  if (label) return <>{label}</>;
  if (fallback) return <>{fallback}</>;
  return <>{productId.slice(0, 8)}</>;
}
