import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreLoginClient } from '@/features/ecommerce/storefront/components/auth/store-login-client';

export async function StoreLoginPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('login.title'), path: '/store/login' },
        ]}
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/40" />}>
        <StoreLoginClient />
      </Suspense>
    </div>
  );
}
