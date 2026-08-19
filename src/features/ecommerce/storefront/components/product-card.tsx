'use client';

import { useTranslations } from 'next-intl';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductCardView } from '@/features/ecommerce/storefront/components/product-card-view';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';

export function ProductCard({ product, brandName }: { product: StorefrontProduct; brandName?: string }) {
  const t = useTranslations('storefront');
  const hasDeal = product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;

  return (
    <ProductCardView
      product={product}
      brandName={brandName}
      formattedPrice={formatPrice(product.price)}
      formattedComparePrice={hasDeal ? formatPrice(product.compareAtPrice!) : undefined}
      stockLabel={t(`stock.${product.stockStatus as StockStatus}`)}
    />
  );
}
