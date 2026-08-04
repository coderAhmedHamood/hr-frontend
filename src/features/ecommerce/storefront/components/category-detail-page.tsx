import { getLocale, getTranslations } from 'next-intl/server';
import { PackageSearch } from 'lucide-react';
import type { StorefrontCategory, StorefrontPaginated, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductCard } from '@/features/ecommerce/storefront/components/product-card';
import { ProductListingGrid } from '@/features/ecommerce/storefront/components/catalog/product-grid';
import { CategorySubcategories } from '@/features/ecommerce/storefront/components/category-subcategories';
import { StorePagination } from '@/features/ecommerce/storefront/components/store-pagination';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import type { StorefrontLocale } from '@/i18n/routing';

export async function CategoryDetailPage({
  category,
  page,
  productsResult,
  subcategories = [],
}: {
  category: StorefrontCategory;
  page: number;
  productsResult: StorefrontPaginated<StorefrontProduct>;
  subcategories?: StorefrontCategory[];
}) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;
  const products = productsResult.items;

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: t('nav.categories'), path: '/store/categories' as const },
    { name: category.name, path: `/store/categories/${category.slug}` as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(category.name, `/store/categories/${category.slug}`, locale)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />

      <StoreBreadcrumbs items={breadcrumbItems} />

      <div>
        <h1 className="font-arabic-display text-2xl font-bold text-foreground">{category.name}</h1>
        {category.description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
        ) : null}
      </div>

      <CategorySubcategories subcategories={subcategories} />

      {products.length === 0 ? (
        <StoreEmptyState icon={PackageSearch} title={t('categories.noResults')} />
      ) : (
        <ProductListingGrid>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductListingGrid>
      )}

      <StorePagination
        basePath={`/store/categories/${category.slug}`}
        page={page}
        totalPages={productsResult.pagination.totalPages}
      />
    </div>
  );
}
