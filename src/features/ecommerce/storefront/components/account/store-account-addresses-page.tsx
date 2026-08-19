import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreAccountAddressesClient } from '@/features/ecommerce/storefront/components/account/store-account-addresses-client';

export async function StoreAccountAddressesPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('account.title'), path: '/store/account' },
          { name: t('account.menu.addresses'), path: '/store/account/addresses' },
        ]}
      />
      <StoreAccountAddressesClient />
    </div>
  );
}
