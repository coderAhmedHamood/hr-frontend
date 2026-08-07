'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductMediaGallery } from '@/features/ecommerce/storefront/components/catalog/product-media-gallery';
import { ProductRating } from '@/features/ecommerce/storefront/components/catalog/product-rating';
import {
  ProductPurchasePanel,
  type ActiveAttributeMedia,
} from '@/features/ecommerce/storefront/components/product-purchase-panel';

export function ProductDetailInteractive({ product }: { product: StorefrontProduct }) {
  const t = useTranslations('storefront.reviews');
  const [activeMedia, setActiveMedia] = React.useState<ActiveAttributeMedia | null>(null);

  const images = activeMedia?.images.length ? activeMedia.images : product.media;
  const fallbackAlt = product.imageAlt || product.name;

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start lg:grid-cols-[minmax(0,26rem)_1fr]">
      <ProductMediaGallery images={images} fallbackAlt={fallbackAlt} activeDescription={activeMedia?.description} />

      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <a
            href="#reviews"
            className="inline-flex w-fit items-center gap-1.5 rounded-full transition-opacity hover:opacity-75"
          >
            <ProductRating
              rating={product.rating && product.rating > 0 ? product.rating : 0}
              reviewCount={product.reviewCount}
              variant="stars"
              size="md"
              allowEmpty
            />
            <span className="text-sm font-medium text-primary underline-offset-2 hover:underline">
              {t('seeReviews')}
            </span>
          </a>
        </div>

        {product.description ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        ) : null}

        <ProductPurchasePanel product={product} onActiveMediaChange={setActiveMedia} />
      </div>
    </div>
  );
}
