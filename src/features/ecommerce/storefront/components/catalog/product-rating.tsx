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
}: ProductRatingProps) {
  const t = useTranslations('storefront.components');

  if (rating === null || rating <= 0) {
    return null;
  }

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex w-fit max-w-full shrink-0 self-start items-center gap-1 rounded-full bg-muted px-2 py-0.5',
          size === 'sm' ? 'text-xs' : 'text-sm',
          className,
        )}
        aria-label={t('ratingLabel', { rating: rating.toFixed(1) })}
      >
        <Star className="h-3 w-3 fill-secondary text-secondary" aria-hidden />
        <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
        {reviewCount && reviewCount > 0 ? (
          <span className="text-muted-foreground">{t('reviewCount', { count: formatReviewCount(reviewCount) })}</span>
        ) : null}
      </div>
    );
  }

  const stars = Array.from({ length: 5 }, (_, index) => {
    const filled = rating >= index + 1;
    return { filled };
  });

  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-label={t('ratingLabel', { rating: rating.toFixed(1) })}>
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
      {reviewCount && reviewCount > 0 ? (
        <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {t('reviewCount', { count: formatReviewCount(reviewCount) })}
        </span>
      ) : null}
    </div>
  );
}
