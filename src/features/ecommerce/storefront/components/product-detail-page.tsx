import { getTranslations } from 'next-intl/server';
import type { StorefrontCategory, StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { StoreBreadcrumbs } from '@/features/ecommerce/storefront/components/store-breadcrumbs';
import { JsonLd } from '@/features/ecommerce/storefront/components/json-ld';
import { breadcrumbJsonLd, productJsonLd } from '@/features/ecommerce/storefront/lib/seo';
import { ProductDetailInteractive } from '@/features/ecommerce/storefront/components/product-detail-interactive';
import { ProductReviewsSection } from '@/features/ecommerce/storefront/components/catalog/product-reviews-section';
import { ProductCard } from '@/features/ecommerce/storefront/components/product-card';
import {
  ProductCarousel,
  ProductCarouselItem,
} from '@/features/ecommerce/storefront/components/catalog/product-carousel';
import { getStorefrontProductsList } from '@/features/ecommerce/storefront/lib/loaders/catalog-loaders';
import type { StorefrontLocale } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';

export async function ProductDetailPage({
  product,
  category,
}: {
  product: StorefrontProduct;
  category: StorefrontCategory | null;
}) {
  const t = await getTranslations('storefront');
  const locale = (await getLocale()) as StorefrontLocale;

  const breadcrumbItems = [
    { name: t('breadcrumbs.home'), path: '/store' as const },
    { name: t('nav.products'), path: '/store/products' as const },
    ...(category ? [{ name: category.name, path: `/store/categories/${category.slug}` as const }] : []),
    { name: product.name, path: `/store/products/${product.slug}` as const },
  ];

  const bestSellers = await getStorefrontProductsList({ tag: 'best-seller', limit: 10 });
  const bestSellerProducts = bestSellers.items.filter((item) => item.id !== product.id);

  return (
    <div className="flex flex-col gap-10">
      <JsonLd data={productJsonLd(product, category, locale)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, locale)} />

      <div className="flex flex-col gap-6">
        <StoreBreadcrumbs items={breadcrumbItems} />
        <ProductDetailInteractive product={product} />
      </div>

      <ProductReviewsSection productId={product.id} rating={product.rating} reviewCount={product.reviewCount} />

      {bestSellerProducts.length > 0 ? (
        <ProductCarousel title={t('home.bestSellers')} viewAllHref="/store/products?tag=best-seller" viewAllLabel={t('home.viewAll')}>
          {bestSellerProducts.map((item) => (
            <ProductCarouselItem key={item.id}>
              <ProductCard product={item} />
            </ProductCarouselItem>
          ))}
        </ProductCarousel>
      ) : null}
    </div>
  );
}
