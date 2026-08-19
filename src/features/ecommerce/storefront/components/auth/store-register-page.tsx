import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreRegisterClient } from '@/features/ecommerce/storefront/components/auth/store-register-client';

export async function StoreRegisterPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('register.title'), path: '/store/register' },
        ]}
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/40" />}>
        <StoreRegisterClient />
      </Suspense>
    </div>
  );
}
