import type { Metadata } from 'next';
import { CategoriesListPage } from '@/features/ecommerce/storefront/components/categories-list-page';
import { CategoriesListPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { categoriesMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCategoriesList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return await categoriesMetadata(config, locale as StorefrontLocale);
}

export default async function Page() {
  if (isStorefrontCsrEnabled()) return <CategoriesListPageCsr />;
  const result = await getStorefrontCategoriesList({ limit: 50 });
  return <CategoriesListPage categories={result.items} />;
}
