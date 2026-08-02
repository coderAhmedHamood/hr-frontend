import type { Metadata } from 'next';
import { CategoriesListPage } from '@/features/ecommerce/storefront/components/categories-list-page';
import { categoriesMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCategoriesList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const config = await getStorefrontCompanyConfig();
  return await categoriesMetadata(config, locale as StorefrontLocale);
}

export default async function Page() {
  const result = await getStorefrontCategoriesList({ limit: 50 });
  return <CategoriesListPage categories={result.items} />;
}
