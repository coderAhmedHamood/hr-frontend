import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoreOrderTrackingPage } from '@/features/ecommerce/storefront/components/orders/store-order-tracking-page';
import { StoreOrderTrackingPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { orderTrackingMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { getStorefrontOrderByNumber } from '@/features/ecommerce/storefront/lib/checkout-actions';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { StorefrontLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; orderNumber: string }>;
  searchParams: Promise<{ phone?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale, orderNumber } = await params;
  const config = await getStorefrontCompanyConfig();
  return orderTrackingMetadata(config, locale as StorefrontLocale, orderNumber);
}

export default async function Page({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { phone } = await searchParams;
  const decoded = decodeURIComponent(orderNumber);
  const phoneValue = phone?.trim() || null;

  if (isStorefrontCsrEnabled()) {
    return <StoreOrderTrackingPageCsr orderNumber={decoded} phone={phoneValue} />;
  }

  const order = await getStorefrontOrderByNumber(decoded, { phone: phoneValue });
  if (!order) notFound();
  return <StoreOrderTrackingPage order={order} />;
}
