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
  className?: string;
};

export function ProductMediaGallery({ images, fallbackAlt, activeDescription, className }: ProductMediaGalleryProps) {
  const [index, setIndex] = React.useState(0);
  const slides = images.length > 0 ? images : [];

  React.useEffect(() => {
    setIndex(0);
  }, [images]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="mx-auto w-full max-w-[220px] md:mx-0">
        {slides.length > 0 ? (
          <CarouselEngine
            itemCount={slides.length}
            onIndexChange={setIndex}
            showDots={false}
            className="overflow-hidden rounded-lg border border-border bg-muted"
            slideClassName="aspect-square"
            renderSlide={(slideIndex) => {
              const slide = slides[slideIndex]!;
              return (
                <ProductImage
                  src={slide.url}
                  alt={slide.alt || fallbackAlt}
                  priority={slideIndex === 0}
                  className="bg-transparent"
                />
              );
            }}
          />
        ) : (
          <ProductImage src={null} alt={fallbackAlt} className="rounded-lg border border-border" />
        )}

        {slides.length > 1 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start" role="tablist">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className={cn(
                  'h-10 w-10 shrink-0 overflow-hidden rounded-md border-2 bg-muted transition-colors',
                  slideIndex === index ? 'border-primary' : 'border-transparent hover:border-border',
                )}
                role="tab"
                aria-selected={slideIndex === index}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.url} alt="" className="h-full w-full object-cover" />
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
