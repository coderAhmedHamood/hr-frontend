'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/features/ecommerce/storefront/components/catalog/section-header';
import { ProductGrid } from '@/features/ecommerce/storefront/components/catalog/product-grid';
import { cn } from '@/shared/utils';

type ProductCarouselProps = {
  title: string;
  subtitle?: string;
  viewAllHref?: `/store${string}`;
  viewAllLabel?: string;
  layout?: 'carousel' | 'grid';
  gridColumns?: { mobile?: number; tablet?: number; desktop?: number };
  children: React.ReactNode;
  className?: string;
};

export function ProductCarousel({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  layout = 'carousel',
  gridColumns,
  children,
  className,
}: ProductCarouselProps) {
  const t = useTranslations('storefront.a11y');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  function scroll(direction: 'prev' | 'next') {
    const element = scrollRef.current;
    if (!element) return;
    const amount = direction === 'next' ? element.clientWidth * 0.85 : -element.clientWidth * 0.85;
    element.scrollBy({ left: amount, behavior: 'smooth' });
  }

  const navButtons =
    layout === 'carousel' ? (
      <div className="hidden items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100 group-focus-within/carousel:opacity-100 md:flex">
        <button
          type="button"
          onClick={() => scroll('prev')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('paginationPrevious')}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scroll('next')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('paginationNext')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      </div>
    ) : null;

  return (
    <section className={cn('group/carousel flex flex-col gap-4', className)} aria-label={title}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
        actions={navButtons}
      />

      {layout === 'grid' ? (
        <ProductGrid columns={gridColumns}>{children}</ProductGrid>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory md:gap-4"
        >
          {children}
        </div>
      )}
    </section>
  );
}

/** Mobile: exactly 2 full cards (50% − half gap). Larger breakpoints use fixed widths. */
export function ProductCarouselItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 snap-start self-stretch',
        'w-[calc(50%-0.375rem)]',
        'sm:w-[180px] md:w-[200px] lg:w-[220px]',
        className,
      )}
    >
      <div className="flex h-full w-full min-w-0 flex-col">{children}</div>
    </div>
  );
}
