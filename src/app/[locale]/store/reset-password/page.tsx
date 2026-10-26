import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreResetPasswordClient } from '@/features/ecommerce/storefront/components/auth/store-reset-password-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('storefront');
  // A one-time link page: not for search engines.
  return { title: t('resetPassword.title'), robots: { index: false, follow: false } };
}

export default async function Page() {
  const t = await getTranslations('storefront');
  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('login.title'), path: '/store/login' },
          { name: t('resetPassword.title'), path: '/store/reset-password' },
        ]}
      />
      <Suspense>
        <StoreResetPasswordClient />
      </Suspense>
    </div>
  );
}
