'use client';

import { useTranslations } from 'next-intl';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreCheckoutClient } from '@/features/ecommerce/storefront/components/checkout/store-checkout-client';
import type { StorefrontCompanyConfig } from '@/features/ecommerce/storefront/domain/storefront-models';

export function StoreCheckoutPage({ config }: { config: StorefrontCompanyConfig }) {
  const t = useTranslations('storefront');

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-28 sm:pb-0">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('cart.title'), path: '/store/cart' },
          { name: t('checkout.title'), path: '/store/checkout' },
        ]}
      />
      <header className="flex flex-col gap-1">
        <h1 className="font-arabic-display text-2xl font-bold tracking-tight text-foreground">
          {t('checkout.title')}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">{t('checkout.description')}</p>
      </header>
      <StoreCheckoutClient checkoutConfig={config.checkout} currency={config.currency} />
    </div>
  );
}
