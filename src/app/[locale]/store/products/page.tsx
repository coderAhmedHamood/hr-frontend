import type { Metadata } from 'next';
import { ProductsBrowsePage } from '@/features/ecommerce/storefront/components/products-browse-page';
import { ProductsBrowsePageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { productsBrowseMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { getStorefrontCategoriesList, getStorefrontProductsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import {
  parseStoreProductFlags,
  resolveStoreProductsListQuery,
  type StoreProductListSearchParams,
} from '@/features/ecommerce/storefront/lib/store-product-list-query';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

const PAGE_SIZE = 15;

type SearchParams = Promise<StoreProductListSearchParams>;
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const [{ locale }, paramsRecord] = await Promise.all([params, searchParams]);
  const { page, category, tag, sort, ...flagParams } = paramsRecord;
  const flags = parseStoreProductFlags(flagParams);
  const config = await getStorefrontCompanyConfig();
  const hasFilter = Boolean(category || tag || sort || Object.keys(flags).length > 0);
  return productsBrowseMetadata(config, locale as StorefrontLocale, {
    page: Number(page) || 1,
    hasFilter,
  });
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const paramsRecord = await searchParams;
  const { page, category, tag, sort, ...flagParams } = paramsRecord;
  const pageNumber = Math.max(1, Number(page) || 1);
  const flags = parseStoreProductFlags(flagParams);

  if (isStorefrontCsrEnabled()) {
    return (
      <ProductsBrowsePageCsr
        page={pageNumber}
        categorySlug={category}
        tag={tag}
        sort={sort}
        flags={flags}
      />
    );
  }

  const [config, categoriesResult] = await Promise.all([
    getStorefrontCompanyConfig(),
    getStorefrontCategoriesList({ limit: 50 }),
  ]);
  const categories = categoriesResult.items;
  const activeCategory = category ? categories.find((item) => item.slug === category) : undefined;
  const productsResult = await getStorefrontProductsList(
    resolveStoreProductsListQuery({
      page: pageNumber,
      limit: PAGE_SIZE,
      categoryId: activeCategory?.id,
      tag,
      sort,
      flags,
    }),
  );

  return (
    <ProductsBrowsePage
      page={pageNumber}
      categorySlug={category}
      tag={tag}
      sort={sort}
      flags={flags}
      categories={categories}
      secondaryNavigation={config.secondaryNavigation}
      storePages={config.storePages}
      productsResult={productsResult}
    />
  );
}
