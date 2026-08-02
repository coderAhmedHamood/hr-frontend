import type { Metadata } from 'next';
import { ProductsBrowsePage } from '@/features/ecommerce/storefront/components/products-browse-page';
import { productsBrowseMetadata } from '@/features/ecommerce/storefront/lib/seo';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { getStorefrontCategoriesList, getStorefrontProductsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

const PAGE_SIZE = 15;

type SearchParams = Promise<{ page?: string; category?: string; tag?: string; sort?: string }>;
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

function resolveListQuery(
  page: number,
  categoryId?: string,
  tag?: string,
  sort?: string,
) {
  const base = { page, limit: PAGE_SIZE, categoryId, tag };
  if (sort === 'newest') return { ...base, sort: 'createdAt' as const, sortDirection: 'desc' as const };
  if (sort === 'price-asc') return { ...base, sort: 'price' as const, sortDirection: 'asc' as const };
  if (sort === 'price-desc') return { ...base, sort: 'price' as const, sortDirection: 'desc' as const };
  if (sort === 'best-sellers') return { ...base, tag: tag ?? 'best-seller' };
  return base;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale }, { page, category, tag, sort }] = await Promise.all([params, searchParams]);
  const config = await getStorefrontCompanyConfig();
  const hasFilter = Boolean(category || tag || sort);
  return productsBrowseMetadata(config, locale as StorefrontLocale, {
    page: Number(page) || 1,
    hasFilter,
  });
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { page, category, tag, sort } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);

  const categoriesResult = await getStorefrontCategoriesList({ limit: 50 });
  const categories = categoriesResult.items;
  const activeCategory = category ? categories.find((item) => item.slug === category) : undefined;
  const productsResult = await getStorefrontProductsList(
    resolveListQuery(pageNumber, activeCategory?.id, tag, sort),
  );

  return (
    <ProductsBrowsePage
      page={pageNumber}
      categorySlug={category}
      tag={tag}
      sort={sort}
      categories={categories}
      productsResult={productsResult}
    />
  );
}
