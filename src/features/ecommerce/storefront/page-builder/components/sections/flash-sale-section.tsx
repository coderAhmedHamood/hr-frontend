import type { ResolvedFlashSaleSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { ProductCard } from '@/features/ecommerce/storefront/components/product-card';
import {
  ProductCarousel,
  ProductCarouselItem,
} from '@/features/ecommerce/storefront/components/catalog/product-carousel';
import { getTranslations } from 'next-intl/server';

export async function FlashSaleSection({ section }: { section: ResolvedFlashSaleSection }) {
  const products = section.data.products;
  if (products.length === 0) return null;

  const title = section.heading.title;
  if (!title) return null;

  const t = await getTranslations('storefront');
  const layout = section.style.layout === 'highlight' ? 'carousel' : section.style.layout;

  return (
    <ProductCarousel
      title={title}
      subtitle={section.heading.subtitle || undefined}
      viewAllHref={section.content.viewAllHref ?? undefined}
      viewAllLabel={t('home.viewAll')}
      layout={layout}
      gridColumns={{ mobile: 2, tablet: 3, desktop: 4 }}
    >
      {products.map((product) =>
        layout === 'grid' ? (
          <ProductCard key={product.id} product={product} />
        ) : (
          <ProductCarouselItem key={product.id}>
            <ProductCard product={product} />
          </ProductCarouselItem>
        ),
      )}
    </ProductCarousel>
  );
}
