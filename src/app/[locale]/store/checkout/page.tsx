import type { Metadata } from 'next';
import { StoreCheckoutPage } from '@/features/ecommerce/storefront/components/checkout/store-checkout-page';
import { checkoutMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return checkoutMetadata(config, locale as StorefrontLocale);
}

export default function Page() {
  return <StoreCheckoutPage />;
}
