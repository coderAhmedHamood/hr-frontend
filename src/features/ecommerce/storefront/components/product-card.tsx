import { getFormatter, getTranslations } from 'next-intl/server';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductCardView } from '@/features/ecommerce/storefront/components/product-card-view';

export async function ProductCard({ product, brandName }: { product: StorefrontProduct; brandName?: string }) {
  const t = await getTranslations('storefront');
  const format = await getFormatter();
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
