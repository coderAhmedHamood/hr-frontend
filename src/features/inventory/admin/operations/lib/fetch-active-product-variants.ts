import { productsApi } from '@/features/catalog/products/lib/api/products';
import type { ProductVariant } from '@/features/ecommerce/domain/types/product';

export async function fetchActiveProductVariants(
  companyId: string,
  productId: string,
): Promise<ProductVariant[]> {
  const product = await productsApi.getById(companyId, productId);
  return (product?.variants ?? []).filter((variant) => variant.isActive !== false);
}
