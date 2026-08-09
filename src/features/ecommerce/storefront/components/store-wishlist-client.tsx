'use client';

import * as React from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { useStorefrontWishlistProducts } from '@/features/ecommerce/storefront/hooks/use-storefront-wishlist-products';
import { useStorefrontWishlistUi } from '@/features/ecommerce/storefront/hooks/use-storefront-wishlist-ui';
import { ProductCardClient } from '@/features/ecommerce/storefront/components/product-card-client';
import { ProductListingGrid } from '@/features/ecommerce/storefront/components/catalog/product-grid';
import { ProductGridSkeleton } from '@/features/ecommerce/storefront/components/catalog/loading-skeleton';
import { StoreErrorState } from '@/features/ecommerce/storefront/components/catalog/store-error-state';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { storeLoginHref } from '@/features/ecommerce/storefront/lib/store-auth-return';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link } from '@/i18n/navigation';

export function StoreWishlistClient() {
  const t = useTranslations('storefront');
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);
  const productIds = useStorefrontWishlistUi((s) => s.productIds);
  const clearWishlist = useStorefrontWishlistUi((s) => s.clear);
  const { data: products, isLoading, isError, refetch } = useStorefrontWishlistProducts();
  const isGuest = !accessToken;
  const [confirmOpen, setConfirmOpen] = React.useState(false);

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
    <div className="flex flex-col gap-4">
      {isGuest ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {t('wishlist.guestHint')}{' '}
          <Link
            href={storeLoginHref('/store/wishlist')}
            prefetch={false}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {t('wishlist.loginToSync')}
          </Link>
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/5"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          {t('wishlist.clearAll')}
        </Button>
      </div>
      <ProductListingGrid>
        {items.map((product) => (
          <ProductCardClient key={product.id} product={product} />
        ))}
      </ProductListingGrid>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('wishlist.clearAll')}</DialogTitle>
            <DialogDescription>{t('wishlist.clearAllConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                clearWishlist(accessToken);
                setConfirmOpen(false);
              }}
            >
              {t('wishlist.clearAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
