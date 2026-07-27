import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreMyOrdersClient } from '@/features/ecommerce/storefront/components/orders/store-my-orders-client';

export async function StoreMyOrdersPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('orders.myOrdersTitle'), path: '/store/orders' },
        ]}
      />
      <div>
        <h1 className="font-arabic-display text-2xl font-bold text-foreground">
          {t('orders.myOrdersTitle')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('orders.myOrdersDescription')}</p>
      </div>
      <StoreMyOrdersClient />
    </div>
  );
}
