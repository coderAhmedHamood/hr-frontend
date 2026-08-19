import type { Metadata } from 'next';
import { StoreCheckoutPage } from '@/features/ecommerce/storefront/components/checkout/store-checkout-page';
import { StoreCheckoutPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { checkoutMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { StorefrontLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return checkoutMetadata(config, locale as StorefrontLocale);
}

export default async function Page() {
  if (isStorefrontCsrEnabled()) return <StoreCheckoutPageCsr />;
  const config = await getStorefrontCompanyConfig();
  return <StoreCheckoutPage config={config} />;
}
