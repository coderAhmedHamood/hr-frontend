import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreWishlistClient } from '@/features/ecommerce/storefront/components/store-wishlist-client';

export async function StoreWishlistPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('wishlist.title'), path: '/store/wishlist' },
        ]}
      />
      <h1 className="font-arabic-display text-2xl font-bold text-foreground">{t('wishlist.title')}</h1>
      <StoreWishlistClient />
    </div>
  );
}
