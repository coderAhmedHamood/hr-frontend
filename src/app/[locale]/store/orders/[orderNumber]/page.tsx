import type { Metadata } from 'next';
import { StoreOrderTrackingPage } from '@/features/ecommerce/storefront/components/orders/store-order-tracking-page';
import { orderTrackingMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; orderNumber: string }>;
  searchParams: Promise<{ phone?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, orderNumber } = await params;
  const config = await getStorefrontCompanyConfig();
  return orderTrackingMetadata(config, locale as StorefrontLocale, orderNumber);
}

export default async function Page({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { phone } = await searchParams;
  return (
    <StoreOrderTrackingPage
      orderNumber={decodeURIComponent(orderNumber)}
      phone={phone?.trim() || null}
    />
  );
}
