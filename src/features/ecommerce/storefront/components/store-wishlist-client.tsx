'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStorefrontWishlistProducts } from '@/features/ecommerce/storefront/hooks/use-storefront-wishlist-products';
import { useStorefrontWishlistUi } from '@/features/ecommerce/storefront/hooks/use-storefront-wishlist-ui';
import { ProductCardClient } from '@/features/ecommerce/storefront/components/product-card-client';
import { ProductListingGrid } from '@/features/ecommerce/storefront/components/catalog/product-grid';
import { ProductGridSkeleton } from '@/features/ecommerce/storefront/components/catalog/loading-skeleton';
import { StoreErrorState } from '@/features/ecommerce/storefront/components/catalog/store-error-state';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { Link } from '@/i18n/navigation';

export function StoreWishlistClient() {
  const t = useTranslations('storefront');
  const productIds = useStorefrontWishlistUi((s) => s.productIds);
  const { data: products, isLoading, isError, refetch } = useStorefrontWishlistProducts();

  if (productIds.length === 0) {
    return (
      <StoreEmptyState icon={Heart} title={t('wishlist.empty')} description={t('wishlist.emptyDescription')}>
        <Link
          href="/store/products"
          prefetch={false}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          {t('wishlist.browseProducts')}
        </Link>
      </StoreEmptyState>
    );
  }

  if (isLoading) {
    return <ProductGridSkeleton count={8} columns={{ mobile: 2, tablet: 3, desktop: 4 }} />;
  }

  if (isError) {
    return <StoreErrorState onRetry={() => refetch()} />;
  }

  const items = products ?? [];

  return (
    <ProductListingGrid>
      {items.map((product) => (
        <ProductCardClient key={product.id} product={product} />
      ))}
    </ProductListingGrid>
  );
}
