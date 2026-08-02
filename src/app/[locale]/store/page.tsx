import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoreHomePage } from '@/features/ecommerce/storefront/components/store-home-page';
import { storeHomeMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { loadStorefrontHomepage } from '@/features/ecommerce/storefront/page-builder/services/page.service';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return storeHomeMetadata(config, locale as StorefrontLocale);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const companyId = getStorefrontCompanyId();
  const page = await loadStorefrontHomepage(companyId, locale as StorefrontLocale);
  if (!page) notFound();

  return <StoreHomePage page={page} />;
}
