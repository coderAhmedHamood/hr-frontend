'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/utils';

type ProductRatingProps = {
  rating: number | null;
  reviewCount?: number | null;
  size?: 'sm' | 'md';
  className?: string;
  /** Noon-like compact pill with single star + score. */
  variant?: 'stars' | 'pill';
  /** When true, render empty stars instead of hiding (product detail link). */
  allowEmpty?: boolean;
};

function formatReviewCount(count: number): string {
  if (count >= 1000) {
    const value = count / 1000;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

export function ProductRating({
  rating,
  reviewCount,
  size = 'sm',
  className,
  variant = 'pill',
  allowEmpty = false,
}: ProductRatingProps) {
  const t = useTranslations('storefront.components');

  const count = Math.max(0, reviewCount ?? 0);
  const hasScore = rating != null && Number.isFinite(rating) && rating > 0;
  const hasCount = count > 0;

  if (!hasScore && !hasCount && !allowEmpty) {
    return null;
  }

  const safeRating = hasScore ? Number(rating) : 0;
  const displayScore = hasScore ? safeRating.toFixed(1) : hasCount ? '—' : '0.0';

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex w-fit max-w-full shrink-0 self-start items-center gap-1 rounded-full bg-muted px-2 py-0.5',
          size === 'sm' ? 'text-xs' : 'text-sm',
          className,
        )}
        aria-label={t('ratingLabel', { rating: hasScore ? safeRating.toFixed(1) : '0' })}
      >
        <Star className="h-3 w-3 fill-secondary text-secondary" aria-hidden />
        <span className="font-semibold tabular-nums text-foreground">{displayScore}</span>
        {hasCount ? (
          <span className="text-muted-foreground">{t('reviewCount', { count: formatReviewCount(count) })}</span>
        ) : null}
      </div>
    );
  }

  const stars = Array.from({ length: 5 }, (_, index) => {
    const filled = safeRating >= index + 1;
    return { filled };
  });

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      aria-label={t('ratingLabel', { rating: hasScore ? safeRating.toFixed(1) : '0' })}
    >
      <div className="flex items-center gap-0.5" aria-hidden>
        {stars.map((star, index) => (
          <Star
            key={index}
            className={cn(
              size === 'sm' && 'h-3.5 w-3.5',
              size === 'md' && 'h-4 w-4',
              star.filled ? 'fill-secondary text-secondary' : 'text-muted-foreground/40',
            )}
          />
        ))}
      </div>
      {hasScore ? (
        <span className={cn('font-semibold tabular-nums text-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {safeRating.toFixed(1)}
        </span>
      ) : null}
      {hasCount ? (
        <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {t('reviewCount', { count: formatReviewCount(count) })}
        </span>
      ) : null}
    </div>
  );
}
