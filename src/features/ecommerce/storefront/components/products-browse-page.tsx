'use client';

import { useLocale, useTranslations } from 'next-intl';
import { PackageSearch } from 'lucide-react';
import type {
  StorefrontCategory,
  StorefrontCompanyConfig,
  StorefrontPaginated,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductCard } from '@/features/ecommerce/storefront/components/product-card';
import { ProductListingGrid } from '@/features/ecommerce/storefront/components/catalog/product-grid';
import { StorePagination } from '@/features/ecommerce/storefront/components/store-pagination';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { StorePlpSidebar } from '@/features/ecommerce/storefront/components/store-plp-sidebar';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { collectionPageJsonLd } from '@/features/ecommerce/storefront/lib/seo-jsonld';
import {
  flagsToQueryRecord,
  type ParsedStoreProductFlags,
} from '@/features/ecommerce/storefront/lib/store-product-list-query';
import type { StorefrontLocale } from '@/i18n/routing';

function productsHeading(
  t: ReturnType<typeof useTranslations<'storefront'>>,
  flags: ParsedStoreProductFlags,
): string {
  if (flags.isNewProduct) return t('home.latestProducts');
  if (flags.isTodayDeal) return t('home.dealsToday');
  if (flags.isWholesale) return t('wholesale.title');
  if (flags.isDiscounted) return t('nav.offersZone');
  return t('products.title');
}

export function ProductsBrowsePage({
  page,
  categorySlug,
  tag,
  sort,
  flags = {},
  categories,
  secondaryNavigation,
  storePages,
  productsResult,
}: {
  page: number;
  categorySlug?: string;
  tag?: string;
  sort?: string;
  flags?: ParsedStoreProductFlags;
  categories: StorefrontCategory[];
  secondaryNavigation?: StorefrontCompanyConfig['secondaryNavigation'];
  storePages?: StorefrontCompanyConfig['storePages'];
  productsResult: StorefrontPaginated<StorefrontProduct>;
}) {
  const t = useTranslations('storefront');
  const locale = useLocale() as StorefrontLocale;
  const products = productsResult.items;
  const title = productsHeading(t, flags);

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={collectionPageJsonLd(title, '/store/products', locale)} />

      <StoreBreadcrumbs
        items={[
          { name: t('breadcrumbs.home'), path: '/store' },
          { name: title, path: '/store/products' },
        ]}
      />

      <h1 className="font-arabic-display text-xl font-bold text-foreground sm:text-2xl">{title}</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <StorePlpSidebar
          categories={categories}
          secondaryNavigation={secondaryNavigation}
          storePages={storePages}
          activeCategorySlug={categorySlug}
          activeTag={tag}
        />

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
            query={{
              category: categorySlug,
              tag,
              sort,
              ...flagsToQueryRecord(flags),
            }}
            page={page}
            totalPages={productsResult.pagination.totalPages}
          />
        </div>
      </div>
    </div>
  );
}
