import type { Metadata } from 'next';
import { StoreCartPage } from '@/features/ecommerce/storefront/components/store-cart-page';
import { cartMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return cartMetadata(config, locale as StorefrontLocale);
}

export default function Page() {
  return <StoreCartPage />;
}
