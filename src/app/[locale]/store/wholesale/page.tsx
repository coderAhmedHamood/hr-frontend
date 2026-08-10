import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CatalogTagPage } from '@/features/ecommerce/storefront/components/catalog-tag-page';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { getStorefrontProductsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';

export const revalidate = 60;

const PAGE_SIZE = 15;
const TAG = 'wholesale';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [t, config] = await Promise.all([
    getTranslations({ locale, namespace: 'storefront' }),
    getStorefrontCompanyConfig(),
  ]);
  return {
    title: `${t('wholesale.title')} | ${config.name}`,
    description: t('wholesale.description'),
  };
}

export default async function Page({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);
  const [t, productsResult] = await Promise.all([
    getTranslations('storefront'),
    getStorefrontProductsList({ page: pageNumber, limit: PAGE_SIZE, tag: TAG }),
  ]);

  return (
    <CatalogTagPage
      title={t('wholesale.title')}
      description={t('wholesale.description')}
      basePath="/store/wholesale"
      page={pageNumber}
      productsResult={productsResult}
    />
  );
}
