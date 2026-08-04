import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CatalogTagPage } from '@/features/ecommerce/storefront/components/catalog-tag-page';
import { CatalogTagPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { getStorefrontProductsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';

export const revalidate = 60;

const PAGE_SIZE = 15;
const TAG = 'deals';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale } = await params;
  const [t, config] = await Promise.all([
    getTranslations({ locale, namespace: 'storefront' }),
    getStorefrontCompanyConfig(),
  ]);
  return {
    title: `${t('offers.title')} | ${config.name}`,
    description: t('offers.description'),
  };
}

export default async function Page({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);

  if (isStorefrontCsrEnabled()) {
    return (
      <CatalogTagPageCsr
        tag={TAG}
        page={pageNumber}
        titleKey="offers.title"
        descriptionKey="offers.description"
        basePath="/store/offers"
        storePageKey="offers"
      />
    );
  }

  const [t, config, productsResult] = await Promise.all([
    getTranslations('storefront'),
    getStorefrontCompanyConfig(),
    getStorefrontProductsList({ page: pageNumber, limit: PAGE_SIZE, tag: TAG }),
  ]);

  if (!config.storePages.offers) notFound();

  return (
    <CatalogTagPage
      title={t('offers.title')}
      description={t('offers.description')}
      basePath="/store/offers"
      page={pageNumber}
      productsResult={productsResult}
    />
  );
}
