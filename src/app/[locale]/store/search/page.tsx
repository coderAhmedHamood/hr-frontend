import type { Metadata } from 'next';
import { StoreSearchPage } from '@/features/ecommerce/storefront/components/store-search-page';
import { searchMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return await searchMetadata(config, locale as StorefrontLocale);
}

export default function Page() {
  return <StoreSearchPage />;
}
