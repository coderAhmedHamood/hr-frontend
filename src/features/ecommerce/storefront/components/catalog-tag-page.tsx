import { getLocale, getTranslations } from 'next-intl/server';
import { PackageSearch } from 'lucide-react';
import type { StorefrontPaginated, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductCard } from '@/features/ecommerce/storefront/components/product-card';
import { ProductListingGrid } from '@/features/ecommerce/storefront/components/catalog/product-grid';
import { StorePagination } from '@/features/ecommerce/storefront/components/store-pagination';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import type { StorefrontLocale } from '@/i18n/routing';

type CatalogTagPageProps = {
  title: string;
  description: string;
  basePath: `/store/${string}`;
  page: number;
  productsResult: StorefrontPaginated<StorefrontProduct>;
};

export async function CatalogTagPage({
  title,
  description,
  basePath,
  page,
  productsResult,
}: CatalogTagPageProps) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;
  const products = productsResult.items;

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(title, basePath, locale)} />

      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: title, path: basePath },
        ]}
      />

      <div>
        <h1 className="font-arabic-display text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>

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
        basePath={basePath}
        page={page}
        totalPages={productsResult.pagination.totalPages}
      />
    </div>
  );
}
