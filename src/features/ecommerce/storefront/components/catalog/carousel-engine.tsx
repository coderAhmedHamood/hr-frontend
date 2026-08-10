'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { isRtlLocale } from '@/i18n/routing';
import { cn } from '@/shared/utils';

type CarouselEngineProps = {
  itemCount: number;
  autoplay?: boolean;
  intervalMs?: number;
  className?: string;
  slideClassName?: string;
  controlsPlacement?: 'below' | 'overlay';
  renderSlide: (index: number) => React.ReactNode;
  onIndexChange?: (index: number) => void;
};

export function CarouselEngine({
  itemCount,
  autoplay = false,
  intervalMs = 5000,
  className,
  slideClassName,
  controlsPlacement = 'overlay',
  renderSlide,
  onIndexChange,
}: CarouselEngineProps) {
  const t = useTranslations('storefront.a11y');
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const [index, setIndex] = React.useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);

  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  const go = React.useCallback(
    (direction: 1 | -1) => {
      setIndex((current) => {
        const next = (current + direction + itemCount) % itemCount;
        onIndexChange?.(next);
        return next;
      });
    },
    [itemCount, onIndexChange],
  );

  const goTo = React.useCallback(
    (nextIndex: number) => {
      setIndex(nextIndex);
      onIndexChange?.(nextIndex);
    },
    [onIndexChange],
  );

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  React.useEffect(() => {
    if (!autoplay || itemCount <= 1 || prefersReducedMotion) return;
    const timer = window.setInterval(() => go(1), intervalMs);
    return () => window.clearInterval(timer);
  }, [autoplay, intervalMs, itemCount, go, prefersReducedMotion]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (itemCount <= 1) return;
    const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backwardKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === forwardKey) {
      event.preventDefault();
      go(1);
    }
    if (event.key === backwardKey) {
      event.preventDefault();
      go(-1);
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 48) {
      go(delta < 0 ? 1 : -1);
    }
    touchStartX.current = null;
  }

  if (itemCount === 0) return null;

  const navButtonClass = cn(
    'absolute top-1/2 z-20 -translate-y-1/2 rounded-full border border-border/40 bg-background p-2.5 text-foreground shadow-elevated',
    'transition-all duration-200 hover:scale-105 hover:bg-muted',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    // Desktop only + visible on carousel hover / focus-within
    'hidden opacity-0 pointer-events-none',
    'md:inline-flex md:group-hover:opacity-100 md:group-hover:pointer-events-auto',
    'md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto',
    'md:focus-visible:opacity-100 md:focus-visible:pointer-events-auto',
  );

  const dots = itemCount > 1 ? (
    <div
      className={cn(
        'flex justify-center gap-2',
        controlsPlacement === 'overlay' ? 'absolute inset-x-0 bottom-4 z-20' : 'mt-3',
      )}
    >
      {Array.from({ length: itemCount }, (_, slideIndex) => (
        <button
          key={slideIndex}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goTo(slideIndex);
          }}
          className={cn(
            'h-2 rounded-full transition-all duration-200',
            slideIndex === index
              ? cn('w-7', controlsPlacement === 'overlay' ? 'bg-background' : 'bg-primary')
              : cn(
                  'w-2.5',
                  controlsPlacement === 'overlay'
                    ? 'bg-background/55 hover:bg-background/80'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
                ),
          )}
          aria-label={t('carouselSlide', { number: slideIndex + 1 })}
          aria-current={slideIndex === index}
        />
      ))}
    </div>
  ) : null;

  return (
    <div
      className={cn('group relative w-full max-w-full min-w-0', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('carousel')}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={cn('relative overflow-hidden', slideClassName)} aria-live="polite">
        {Array.from({ length: itemCount }, (_, slideIndex) => (
          <div
            key={slideIndex}
            className={cn(
              'w-full max-w-full transition-opacity duration-500 ease-in-out',
              slideIndex === index
                ? 'relative z-[1] opacity-100'
                : 'pointer-events-none absolute inset-0 z-0 opacity-0',
            )}
            aria-hidden={slideIndex !== index}
          >
            {renderSlide(slideIndex)}
          </div>
        ))}

        {itemCount > 1 && controlsPlacement === 'overlay' ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                go(-1);
              }}
              className={cn(navButtonClass, 'start-3')}
              aria-label={t('carouselPrevious')}
            >
              <PreviousIcon className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                go(1);
              }}
              className={cn(navButtonClass, 'end-3')}
              aria-label={t('carouselNext')}
            >
              <NextIcon className="h-5 w-5" aria-hidden />
            </button>
            {dots}
          </>
        ) : null}
      </div>

      {itemCount > 1 && controlsPlacement === 'below' ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className={cn(navButtonClass, 'start-3')}
            aria-label={t('carouselPrevious')}
          >
            <PreviousIcon className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className={cn(navButtonClass, 'end-3')}
            aria-label={t('carouselNext')}
          >
            <NextIcon className="h-5 w-5" aria-hidden />
          </button>
          {dots}
        </>
      ) : null}
    </div>
  );
}
