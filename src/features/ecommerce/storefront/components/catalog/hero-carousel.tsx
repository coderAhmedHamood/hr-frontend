'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { StorefrontHeroSlide } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { HeroCarouselLayout } from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import { CarouselEngine } from '@/features/ecommerce/storefront/components/catalog/carousel-engine';
import { Link } from '@/i18n/navigation';
import { STOREFRONT_MAIN_FULL_BLEED_CLASS } from '@/features/ecommerce/storefront/components/catalog/layout-classes';
import { resolveStorefrontImageSrc } from '@/features/ecommerce/storefront/lib/resolve-storefront-image-src';
import { cn } from '@/shared/utils';

type HeroCarouselProps = {
  slides: StorefrontHeroSlide[];
  title?: string;
  subtitle?: string;
  autoplay?: boolean;
  intervalMs?: number;
  layout?: HeroCarouselLayout;
  heightRatio?: string;
};

function parseAspectRatio(heightRatio: string): string {
  const parts = heightRatio.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${parts[0].trim()}/${parts[1].trim()}`;
  }
  return '21/7';
}

function HeroSlideFrame({
  slide,
  aspectRatio,
  isPriority,
}: {
  slide: StorefrontHeroSlide;
  aspectRatio: string;
  isPriority: boolean;
}) {
  const t = useTranslations('storefront');
  const alt = slide.alt || slide.title || 'Banner';
  const mobileSrc = resolveStorefrontImageSrc(slide.mobileImageUrl);
  const desktopSrc = resolveStorefrontImageSrc(slide.imageUrl) ?? mobileSrc;

  if (!desktopSrc && !mobileSrc) return null;

  const frame = (
    <div
      className={cn(
        'relative w-full max-w-full overflow-hidden rounded-2xl bg-muted',
        'min-h-[200px] sm:min-h-[260px] md:min-h-[320px] lg:min-h-[380px]',
      )}
      style={{ aspectRatio }}
    >
      {mobileSrc ? (
        <Image
          src={mobileSrc}
          alt={alt}
          fill
          unoptimized
          priority={isPriority}
          className={cn('object-cover', desktopSrc && desktopSrc !== mobileSrc && 'md:hidden')}
          sizes="(min-width: 1024px) 1400px, 100vw"
        />
      ) : null}
      {desktopSrc ? (
        <Image
          src={desktopSrc}
          alt={alt}
          fill
          unoptimized
          priority={isPriority}
          className={cn('object-cover', mobileSrc && mobileSrc !== desktopSrc && 'hidden md:block')}
          sizes="(min-width: 1024px) 1400px, 100vw"
        />
      ) : null}

      {slide.href ? (
        <span className="sr-only">{t('hero.shopNow')}</span>
      ) : null}
    </div>
  );

  if (slide.href) {
    return (
      <Link href={slide.href} prefetch={false} className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {frame}
      </Link>
    );
  }

  return frame;
}

export function HeroCarousel({
  slides,
  autoplay = true,
  intervalMs = 5000,
  layout = 'contained',
  heightRatio = '21/7',
}: HeroCarouselProps) {
  const aspectRatio = parseAspectRatio(heightRatio);
  const visibleSlides = slides.filter(
    (slide) =>
      resolveStorefrontImageSrc(slide.imageUrl) ?? resolveStorefrontImageSrc(slide.mobileImageUrl),
  );

  if (visibleSlides.length === 0) return null;

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-4">
      <div
        className={cn(
          'min-w-0 w-full max-w-full',
          layout === 'full-bleed' && STOREFRONT_MAIN_FULL_BLEED_CLASS,
        )}
      >
        <CarouselEngine
          itemCount={visibleSlides.length}
          autoplay={autoplay}
          intervalMs={intervalMs}
          controlsPlacement="overlay"
          className="w-full max-w-full"
          slideClassName={cn(
            'w-full max-w-full overflow-hidden rounded-2xl shadow-soft',
          )}
          renderSlide={(activeIndex) => {
            const slide = visibleSlides[activeIndex];
            if (!slide) return null;
            return (
              <HeroSlideFrame slide={slide} aspectRatio={aspectRatio} isPriority={activeIndex === 0} />
            );
          }}
        />
      </div>
    </div>
  );
}
