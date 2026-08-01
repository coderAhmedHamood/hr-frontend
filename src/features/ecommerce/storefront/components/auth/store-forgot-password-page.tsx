import { getTranslations } from 'next-intl/server';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreForgotPasswordClient } from '@/features/ecommerce/storefront/components/auth/store-forgot-password-client';

export async function StoreForgotPasswordPage() {
  const t = await getTranslations('storefront');

  return (
    <div className="flex flex-col gap-6">
      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('login.title'), path: '/store/login' },
          { name: t('forgotPassword.title'), path: '/store/forgot-password' },
        ]}
      />
      <StoreForgotPasswordClient />
    </div>
  );
}
