import { Star, BadgeCheck } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import {
  buildBreakdownFromReviews,
  fetchPublicProductReviews,
} from '@/features/ecommerce/shared/lib/api/store-reviews-api';
import { isStoreHttpEnabled } from '@/features/ecommerce/storefront/lib/api/store-http';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { StorefrontLocale } from '@/i18n/routing';
import { cn } from '@/shared/utils';

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5',
            rating >= index + 1 ? 'fill-secondary text-secondary' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </div>
  );
}

export async function ProductReviewsSection({
  productId,
  rating,
  reviewCount,
}: {
  productId: string;
  rating: number | null;
  reviewCount: number;
}) {
  const t = await getTranslations('storefront.reviews');
  const locale = (await getLocale()) as StorefrontLocale;

  let average = rating ?? 0;
  let summary = {
    average,
    total: reviewCount,
    breakdown: ([5, 4, 3, 2, 1] as const).map((stars) => ({
      stars,
      count: 0,
      percent: 0,
    })),
  };
  let reviews: Awaited<ReturnType<typeof fetchPublicProductReviews>>['items'] = [];

  if (isStoreHttpEnabled()) {
    try {
      const page = await fetchPublicProductReviews({
        companyId: getStorefrontCompanyId(),
        productId,
        limit: 20,
      });
      const built = buildBreakdownFromReviews(page.items);
      reviews = page.items.slice(0, 10);
      const total = page.total > 0 ? page.total : reviewCount;
      average = built.average > 0 ? built.average : (rating ?? 0);
      summary = {
        average,
        total,
        breakdown: built.breakdown,
      };
    } catch (error) {
      console.warn('[store] product reviews fetch failed', error);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-YE' : 'en-US', {
    dateStyle: 'medium',
  });

  const showEmpty = summary.total === 0 && reviews.length === 0;

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-border pt-8">
      <h2 className="mb-5 text-xl font-bold text-foreground">{t('title')}</h2>

      {showEmpty ? (
        <p className="text-sm text-muted-foreground">{t('noReviews')}</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-[minmax(0,16rem)_1fr]">
          <div className="flex flex-col items-start gap-2 rounded-xl border border-border bg-muted/30 p-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-foreground">{average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">{t('outOf5')}</span>
            </div>
            <Stars rating={average} size="md" />
            <p className="text-sm text-muted-foreground">{t('basedOn', { count: summary.total })}</p>

            <div className="mt-3 w-full space-y-1.5">
              {summary.breakdown.map((row) => (
                <div key={row.stars} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-10 shrink-0" dir="ltr">
                    {row.stars} ★
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/60">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${row.percent}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-end tabular-nums">{row.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-border/70 bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{review.authorName}</span>
                    {review.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                        <BadgeCheck className="h-3 w-3" aria-hidden />
                        {t('verifiedPurchase')}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(review.date))}
                  </span>
                </div>
                {review.comment ? (
                  <>
                    <Stars rating={review.rating} />
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{review.comment}</p>
                  </>
                ) : (
                  <Stars rating={review.rating} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
