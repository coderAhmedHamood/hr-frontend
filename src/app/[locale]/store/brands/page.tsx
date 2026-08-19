import type { Metadata } from 'next';
import { BrandsListPage } from '@/features/ecommerce/storefront/components/brands-list-page';
import { BrandsListPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { brandsMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontBrandsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return await brandsMetadata(config, locale as StorefrontLocale);
}

export default async function Page() {
  if (isStorefrontCsrEnabled()) return <BrandsListPageCsr />;
  const result = await getStorefrontBrandsList({ limit: 50 });
  return <BrandsListPage brands={result.items} />;
}
