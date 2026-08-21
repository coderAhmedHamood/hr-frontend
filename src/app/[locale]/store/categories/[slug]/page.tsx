import type { Metadata } from 'next';
import { CategoryDetailPage } from '@/features/ecommerce/storefront/components/category-detail-page';
import { CategoryDetailPageCsr } from '@/features/ecommerce/storefront/components/store-csr-pages';
import { categoryMetadata } from '@/features/ecommerce/storefront/lib/seo';
import {
  getStorefrontCategoriesList,
  getStorefrontProductsList,
} from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import { getStorefrontCategoryBySlug } from '@/features/ecommerce/storefront/lib/loaders/storefront-loaders';
import { getStorefrontCompanyConfig } from '@/features/ecommerce/storefront/lib/get-storefront-company-config';
import { isStorefrontCsrEnabled } from '@/features/ecommerce/storefront/lib/is-storefront-csr';
import type { StorefrontLocale } from '@/i18n/routing';

export const revalidate = 60;

const PAGE_SIZE = 12;

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  if (isStorefrontCsrEnabled()) return {};
  const { locale, slug } = await params;
  const category = await getStorefrontCategoryBySlug(slug);
  const config = await getStorefrontCompanyConfig();
  return categoryMetadata(category, config, locale as StorefrontLocale);
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;

  if (isStorefrontCsrEnabled()) {
    return <CategoryDetailPageCsr slug={slug} />;
  }

  const category = await getStorefrontCategoryBySlug(slug);
  const [productsResult, categoriesResult] = await Promise.all([
    getStorefrontProductsList({
      categoryId: category.id,
      page: 1,
      limit: PAGE_SIZE,
    }),
    getStorefrontCategoriesList({ limit: 200 }),
  ]);

  const subcategories = categoriesResult.items
    .filter((item) => item.parentId === category.id)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <CategoryDetailPage
      category={category}
      productsResult={productsResult}
      subcategories={subcategories}
    />
  );
}
