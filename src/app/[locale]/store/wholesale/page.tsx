import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CatalogTagPage } from '@/features/ecommerce/storefront/components/catalog-tag-page';
import { CatalogTagPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { getStorefrontProductsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import { resolveStoreProductsListQuery } from '@/features/ecommerce/storefront/lib/store-product-list-query';

export const revalidate = 60;

const PAGE_SIZE = 15;

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
    title: `${t('wholesale.title')} | ${config.name}`,
    description: t('wholesale.description'),
  };
}

export default async function Page({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);

  if (isStorefrontCsrEnabled()) {
    return (
      <CatalogTagPageCsr
        page={pageNumber}
        titleKey="wholesale.title"
        descriptionKey="wholesale.description"
        basePath="/store/wholesale"
        storePageKey="wholesale"
        flag="isWholesale"
      />
    );
  }

  const [t, config, productsResult] = await Promise.all([
    getTranslations('storefront'),
    getStorefrontCompanyConfig(),
    getStorefrontProductsList(
      resolveStoreProductsListQuery({
        page: pageNumber,
        limit: PAGE_SIZE,
        flags: { isWholesale: true },
        sort: 'newest',
      }),
    ),
  ]);

  if (!config.storePages.wholesale) notFound();

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
