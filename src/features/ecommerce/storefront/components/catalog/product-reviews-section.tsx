'use client';

import * as React from 'react';
import { BadgeCheck, CheckCircle2, Loader2, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  buildBreakdownFromReviews,
  createStoreProductReview,
  fetchPublicProductReviews,
} from '@/features/ecommerce/shared/lib/api/store-reviews-api';
import { isStoreHttpEnabled, StoreHttpError } from '@/features/ecommerce/storefront/lib/api/store-http';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import { resolveStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { StorefrontLocale } from '@/i18n/routing';
import { cn, formatDisplayDate } from '@/shared/utils';

function Stars({
  rating,
  size = 'sm',
  interactive = false,
  onSelect,
}: {
  rating: number;
  size?: 'sm' | 'md';
  interactive?: boolean;
  onSelect?: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden={!interactive}>
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        const filled = rating >= value;
        const className = cn(
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5',
          filled ? 'fill-secondary text-secondary' : 'text-muted-foreground/30',
          interactive && 'transition-transform hover:scale-110',
        );
        if (!interactive) {
          return <Star key={value} className={className} />;
        }
        return (
          <button
            key={value}
            type="button"
            className="rounded p-0.5"
            aria-label={`${value}`}
            onClick={() => onSelect?.(value)}
          >
            <Star className={className} />
          </button>
        );
      })}
    </div>
  );
}

type ReviewItem = Awaited<ReturnType<typeof fetchPublicProductReviews>>['items'][number];

export function ProductReviewsSection({
  productId,
  companyId,
  rating,
  reviewCount,
}: {
  productId: string;
  companyId: string;
  rating: number | null;
  reviewCount: number;
}) {
  const t = useTranslations('storefront.reviews');
  const locale = useLocale() as StorefrontLocale;
  const customer = useStorefrontCustomerUi((s) => s.customer);
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);

  const resolvedCompanyId = resolveStorefrontCompanyId(companyId);

  const [average, setAverage] = React.useState(rating ?? 0);
  const [summary, setSummary] = React.useState({
    average: rating ?? 0,
    total: reviewCount,
    breakdown: ([5, 4, 3, 2, 1] as const).map((stars) => ({
      stars,
      count: 0,
      percent: 0,
    })),
  });
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const [formRating, setFormRating] = React.useState(5);
  const [guestName, setGuestName] = React.useState(customer?.name ?? '');
  const [title, setTitle] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (customer?.name) setGuestName(customer.name);
  }, [customer?.name]);

  React.useEffect(() => {
    if (!isStoreHttpEnabled()) {
      setLoading(false);
      setLoadError(t('httpDisabled'));
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const page = await fetchPublicProductReviews({
          companyId: resolvedCompanyId,
          productId,
          limit: 50,
        });
        if (cancelled) return;
        const built = buildBreakdownFromReviews(page.items);
        const total = page.total > 0 ? page.total : page.items.length || reviewCount;
        const nextAverage =
          built.average > 0
            ? built.average
            : rating != null && rating > 0
              ? rating
              : 0;
        setReviews(page.items);
        setAverage(nextAverage);
        setSummary({
          average: nextAverage,
          total,
          breakdown: built.breakdown,
        });
      } catch (error) {
        if (cancelled) return;
        console.warn('[store] product reviews fetch failed', error);
        setLoadError(t('loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, resolvedCompanyId, rating, reviewCount, reloadKey, t]);

  const showEmpty = !loading && !loadError && summary.total === 0 && reviews.length === 0;

  const myReview = React.useMemo(
    () =>
      customer?.partnerId
        ? reviews.find((review) => review.partnerId === customer.partnerId) ?? null
        : null,
    [reviews, customer?.partnerId],
  );
  const hasAlreadyReviewed = Boolean(myReview) || Boolean(submitSuccess);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const name = guestName.trim() || customer?.name?.trim() || '';
    if (!name && !accessToken) {
      setSubmitError(t('nameRequired'));
      return;
    }
    if (formRating < 1 || formRating > 5) {
      setSubmitError(t('ratingRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await createStoreProductReview({
        companyId: resolvedCompanyId,
        productId,
        rating: formRating,
        title,
        body: comment,
        guestName: name || undefined,
        partnerId: customer?.partnerId ?? null,
        accessToken,
      });
      setTitle('');
      setComment('');
      setFormRating(5);
      setSubmitSuccess(result.pendingModeration ? t('submitPending') : t('submitSuccess'));
      if (!result.pendingModeration) {
        setReloadKey((value) => value + 1);
      }
    } catch (error) {
      const message =
        error instanceof StoreHttpError
          ? error.message
          : error instanceof Error
            ? error.message
            : t('submitError');
      setSubmitError(message || t('submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-border pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
        {!loading && summary.total > 0 ? (
          <p className="text-sm text-muted-foreground">{t('basedOn', { count: summary.total })}</p>
        ) : null}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,17rem)_1fr]">
        <div className="flex flex-col items-start gap-3 self-start rounded-2xl border border-border bg-gradient-to-b from-muted/50 to-muted/20 p-5 lg:sticky lg:top-24">
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-bold tracking-tight text-foreground">
              {average > 0 ? average.toFixed(1) : '—'}
            </span>
            <span className="text-sm text-muted-foreground">{t('outOf5')}</span>
          </div>
          <Stars rating={average} size="md" />
          <p className="text-sm text-muted-foreground">
            {t('basedOn', { count: summary.total })}
          </p>

          <div className="mt-3 w-full space-y-2">
            {summary.breakdown.map((row) => (
              <div key={row.stars} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-10 shrink-0 tabular-nums" dir="ltr">
                  {row.stars} ★
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/80">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-end tabular-nums">{row.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
              <button
                type="button"
                className="ms-2 underline"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                {t('retry')}
              </button>
            </div>
          ) : showEmpty ? (
            <p className="text-sm text-muted-foreground">{t('noReviews')}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.map((review) => {
                const displayName =
                  review.authorName || (review.verified ? t('registeredCustomer') : t('guestCustomer'));
                return (
                  <li
                    key={review.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 transition-shadow hover:shadow-sm sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                        >
                          {displayName.trim().charAt(0).toUpperCase() || '؟'}
                        </span>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{displayName}</span>
                            {review.verified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                                <BadgeCheck className="h-3 w-3" aria-hidden />
                                {t('verifiedPurchase')}
                              </span>
                            ) : null}
                          </div>
                          <Stars rating={review.rating} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDisplayDate(review.date)}
                      </span>
                    </div>
                    {review.title || review.comment ? (
                      <div className="mt-3 space-y-1 ps-12">
                        {review.title ? (
                          <p className="text-sm font-medium text-foreground">{review.title}</p>
                        ) : null}
                        {review.body || (!review.title && review.comment) ? (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {review.body || review.comment}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {hasAlreadyReviewed ? (
            <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 sm:p-5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">{t('alreadyReviewedTitle')}</p>
                {submitSuccess ? <p className="text-xs text-success">{submitSuccess}</p> : null}
              </div>
            </div>
          ) : (
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5"
            >
              <h3 className="text-sm font-semibold text-foreground">{t('writeTitle')}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t('writeHint')}</p>

              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">{t('yourRating')}</p>
                  <Stars
                    rating={formRating}
                    size="md"
                    interactive
                    onSelect={setFormRating}
                  />
                </div>

                {!accessToken ? (
                  <Input
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder={t('namePlaceholder')}
                    required
                    maxLength={80}
                  />
                ) : null}

                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t('titlePlaceholder')}
                  maxLength={120}
                />

                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={t('commentPlaceholder')}
                  rows={4}
                  maxLength={2000}
                />

                {submitError ? (
                  <p className="text-sm text-destructive">{submitError}</p>
                ) : null}

                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {t('submitting')}
                    </>
                  ) : (
                    t('submit')
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
