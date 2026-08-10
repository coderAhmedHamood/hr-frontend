'use client';

import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import { AddToCartButton } from '@/features/ecommerce/storefront/components/catalog/add-to-cart-button';
import { FavoriteButton } from '@/features/ecommerce/storefront/components/catalog/favorite-button';

type ProductCardActionsProps = {
  productId: string;
  stockStatus: StockStatus;
  layout?: 'overlay' | 'inline';
};

/** @deprecated Use FavoriteButton and AddToCartButton from catalog directly. */
export function ProductCardActions({ productId, stockStatus, layout = 'overlay' }: ProductCardActionsProps) {
  if (layout === 'overlay') {
    return <FavoriteButton productId={productId} variant="overlay" />;
  }

  return (
    <>
      <FavoriteButton productId={productId} variant="outline" />
      <AddToCartButton productId={productId} stockStatus={stockStatus} />
    </>
  );
}

/** @deprecated Use AddToCartButton from catalog directly. */
export function ProductCardCartButton({ productId, stockStatus }: ProductCardActionsProps) {
  return <AddToCartButton productId={productId} stockStatus={stockStatus} />;
}
