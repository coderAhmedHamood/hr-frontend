import type { Metadata } from 'next';
import { StoreForgotPasswordPage } from '@/features/ecommerce/storefront/components/auth/store-forgot-password-page';
import { storeForgotPasswordMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return storeForgotPasswordMetadata(config, locale as StorefrontLocale);
}

export default function Page() {
  return <StoreForgotPasswordPage />;
}
