'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductCardView } from '@/features/ecommerce/storefront/components/product-card-view';

/** Client variant for pages that must stay under a client boundary (cart/wishlist grids). */
export function ProductCardClient({ product, brandName }: { product: StorefrontProduct; brandName?: string }) {
  const t = useTranslations('storefront');
  const format = useFormatter();
  const hasDeal = product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;

  return (
    <ProductCardView
      product={product}
      brandName={brandName}
      formattedPrice={format.number(product.price.amount, { style: 'currency', currency: product.price.currency })}
      formattedComparePrice={
        hasDeal
          ? format.number(product.compareAtPrice!.amount, {
              style: 'currency',
              currency: product.compareAtPrice!.currency,
            })
          : undefined
      }
      stockLabel={t(`stock.${product.stockStatus as StockStatus}`)}
    />
  );
}
