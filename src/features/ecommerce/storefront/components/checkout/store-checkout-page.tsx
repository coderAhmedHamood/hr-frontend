import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreCheckoutClient } from '@/features/ecommerce/storefront/components/checkout/store-checkout-client';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';

export async function StoreCheckoutPage() {
  const t = await getTranslations('storefront');
  const config = await getStorefrontCompanyConfig();

  return (
    <div className="flex flex-col gap-5 pb-28 sm:pb-0">
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
