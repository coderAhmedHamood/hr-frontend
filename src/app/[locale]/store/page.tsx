import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoreHomePageView } from '@/features/ecommerce/storefront/components/store-home-page';
import { StoreHomePageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { storeHomeMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import { loadStorefrontHomepage } from '@/features/ecommerce/storefront/page-builder/services/page.service';
import type { StorefrontLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return storeHomeMetadata(config, locale as StorefrontLocale);
}

export default async function Page({ params }: Props) {
  if (isStorefrontCsrEnabled()) return <StoreHomePageCsr />;

  const { locale } = await params;
  const companyId = getStorefrontCompanyId();
  const config = await getStorefrontCompanyConfig();
  const page = await loadStorefrontHomepage(
    companyId,
    locale as StorefrontLocale,
    config.seo.homeTitle,
  );
  if (!page) notFound();

  return <StoreHomePageView page={page} config={config} />;
}
