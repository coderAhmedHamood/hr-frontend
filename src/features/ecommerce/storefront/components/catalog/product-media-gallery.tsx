'use client';

import * as React from 'react';
import { CarouselEngine } from '@/features/ecommerce/storefront/components/catalog/carousel-engine';
import { ProductImage } from '@/features/ecommerce/storefront/components/catalog/product-image';
import type { MediaItem } from '@/features/ecommerce/domain/types/common';
import { cn } from '@/shared/utils';

type ProductMediaGalleryProps = {
  images: MediaItem[];
  fallbackAlt: string;
  /** Blurb tied to the currently selected attribute value, shown under the gallery. */
  activeDescription?: string;
  /** Sourced from the product's `imageDisplayAspectRatio` setting. */
  aspectRatio?: 'square' | '4/3' | '3/4';
  /** Sourced from the product's `imageDisplayFit` setting — applied to BOTH the
   * main slide and the thumbnail rail, so the same photo never fits differently
   * depending on which one is showing it. */
  fit?: 'contain' | 'cover';
  className?: string;
};

const galleryAspectClasses = {
  square: 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '3/4': 'aspect-[3/4]',
} as const;

export function ProductMediaGallery({
  images,
  fallbackAlt,
  activeDescription,
  aspectRatio = 'square',
  fit = 'contain',
  className,
}: ProductMediaGalleryProps) {
  const [index, setIndex] = React.useState(0);
  const slides = images.length > 0 ? images : [];

  React.useEffect(() => {
    setIndex(0);
  }, [images]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="mx-auto w-full max-w-[220px] md:mx-0">
        {slides.length > 0 ? (
          // The border lives here, on the same element CarouselEngine clips the
          // slide to (`overflow-hidden` + `slideClassName`'s aspect box) — not on
          // a separate wrapper — so it always hugs the visible image exactly.
          <CarouselEngine
            itemCount={slides.length}
            onIndexChange={setIndex}
            showDots={false}
            className={cn('overflow-hidden rounded-lg border border-border bg-muted', galleryAspectClasses[aspectRatio])}
            slideClassName={galleryAspectClasses[aspectRatio]}
            renderSlide={(slideIndex) => {
              const slide = slides[slideIndex]!;
              return (
                <ProductImage
                  src={slide.url}
                  alt={slide.alt || fallbackAlt}
                  aspectRatio={aspectRatio}
                  fit={fit}
                  priority={slideIndex === 0}
                  className="bg-transparent"
                />
              );
            }}
          />
        ) : (
          <ProductImage
            src={null}
            alt={fallbackAlt}
            aspectRatio={aspectRatio}
            className="rounded-lg border border-border"
          />
        )}

        {slides.length > 1 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start" role="tablist">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className={cn(
                  'relative h-10 w-10 shrink-0 overflow-hidden rounded-md border-2 bg-muted transition-colors',
                  slideIndex === index ? 'border-primary' : 'border-transparent hover:border-border',
                )}
                role="tab"
                aria-selected={slideIndex === index}
              >
                {/* Same fit as the main slide above — was hardcoded object-cover
                    regardless of the product's setting, so the thumbnail could
                    crop a photo the main slide showed whole. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.url}
                  alt=""
                  className={cn('h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain p-0.5')}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {activeDescription ? (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">{activeDescription}</p>
      ) : null}
    </div>
  );
}
