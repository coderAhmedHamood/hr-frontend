import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreAccountClient } from '@/features/ecommerce/storefront/components/account/store-account-client';

export async function StoreAccountPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('account.title'), path: '/store/account' },
        ]}
      />
      <StoreAccountClient />
    </div>
  );
}
