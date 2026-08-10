'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ProductImage } from '@/features/ecommerce/storefront/components/catalog/product-image';
import type { ProductDisplayImage } from '@/features/ecommerce/storefront/lib/product-display';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

type ProductCardMediaProps = {
  images: ProductDisplayImage[];
  fallbackAlt: string;
  href: `/store${string}`;
  aspectRatio?: 'square' | '4/3' | '3/4';
  imageClassName?: string;
  sizes?: string;
  className?: string;
};

/**
 * Card media: single image, or a swipe carousel with dots only (no arrows).
 */
export function ProductCardMedia({
  images,
  fallbackAlt,
  href,
  aspectRatio = 'square',
  imageClassName,
  sizes,
  className,
}: ProductCardMediaProps) {
  const t = useTranslations('storefront.a11y');
  const [index, setIndex] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const swiped = React.useRef(false);

  const slides = images.length > 0 ? images : [{ url: '', alt: fallbackAlt }];
  const multi = slides.length > 1;
  const safeIndex = Math.min(index, slides.length - 1);
  const current = slides[safeIndex] ?? slides[0]!;

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    swiped.current = false;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null || !multi) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 36) {
      swiped.current = true;
      goTo(delta < 0 ? safeIndex + 1 : safeIndex - 1);
    }
    touchStartX.current = null;
  }

  function handleLinkClick(event: React.MouseEvent) {
    if (swiped.current) {
      event.preventDefault();
      swiped.current = false;
    }
  }

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role={multi ? 'region' : undefined}
      aria-roledescription={multi ? 'carousel' : undefined}
      aria-label={multi ? t('carousel') : undefined}
    >
      <Link href={href} prefetch={false} className="block" onClick={handleLinkClick} tabIndex={-1}>
        <ProductImage
          src={current.url || null}
          alt={current.alt || fallbackAlt}
          aspectRatio={aspectRatio}
          imageClassName={imageClassName}
          sizes={sizes}
        />
      </Link>

      {multi ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[5] flex justify-center gap-1.5">
          {slides.map((slide, slideIndex) => (
            <button
              key={`${slide.url}-${slideIndex}`}
              type="button"
              className={cn(
                'pointer-events-auto h-1.5 rounded-full transition-all duration-200',
                slideIndex === safeIndex
                  ? 'w-4 bg-primary'
                  : 'w-1.5 bg-foreground/25 hover:bg-foreground/40',
              )}
              aria-label={t('carouselSlide', { number: slideIndex + 1 })}
              aria-current={slideIndex === safeIndex}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goTo(slideIndex);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
