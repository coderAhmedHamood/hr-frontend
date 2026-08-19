import type { Metadata } from 'next';
import { StoreAccountPage } from '@/features/ecommerce/storefront/components/account/store-account-page';
import { storeAccountMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return storeAccountMetadata(config, locale as StorefrontLocale);
}

export default function Page() {
  return <StoreAccountPage />;
}
