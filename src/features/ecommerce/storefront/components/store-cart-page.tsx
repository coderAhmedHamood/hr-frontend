import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreCartClient } from '@/features/ecommerce/storefront/components/store-cart-client';

export async function StoreCartPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('cart.title'), path: '/store/cart' },
        ]}
      />
      <h1 className="font-arabic-display text-2xl font-bold text-foreground">{t('cart.title')}</h1>
      <StoreCartClient />
    </div>
  );
}
