import { getLocale, getTranslations } from 'next-intl/server';
import { PackageSearch } from 'lucide-react';
import type { StorefrontCategory, StorefrontPaginated, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductCard } from '@/features/ecommerce/storefront/components/product-card';
import { ProductListingGrid } from '@/features/ecommerce/storefront/components/catalog/product-grid';
import { StorePagination } from '@/features/ecommerce/storefront/components/store-pagination';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { StorePlpSidebar } from '@/features/ecommerce/storefront/components/store-plp-sidebar';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import type { StorefrontLocale } from '@/i18n/routing';

export async function ProductsBrowsePage({
  page,
  categorySlug,
  tag,
  sort,
  categories,
  productsResult,
}: {
  page: number;
  categorySlug?: string;
  tag?: string;
  sort?: string;
  categories: StorefrontCategory[];
  productsResult: StorefrontPaginated<StorefrontProduct>;
}) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;
  const products = productsResult.items;

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(t('products.title'), '/store/products', locale)} />

      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: t('products.title'), path: '/store/products' },
        ]}
      />

      <h1 className="font-arabic-display text-xl font-bold text-foreground sm:text-2xl">{t('products.title')}</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <StorePlpSidebar categories={categories} activeCategorySlug={categorySlug} activeTag={tag} />

        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <StoreEmptyState icon={PackageSearch} title={t('products.noResults')} />
          ) : (
            <ProductListingGrid>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ProductListingGrid>
          )}

          <StorePagination
            basePath="/store/products"
            query={{ category: categorySlug, tag, sort }}
            page={page}
            totalPages={productsResult.pagination.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
