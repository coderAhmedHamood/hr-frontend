'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Star, Trash2, X } from 'lucide-react';
import { Can } from '@/components/shared/can';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useDeleteProductReview,
  useProductReviews,
  useUpdateProductReview,
} from '@/features/ecommerce/admin/reviews/hooks/use-product-reviews';
import type { ProductReviewStatus } from '@/features/ecommerce/admin/reviews/lib/api/product-reviews-api';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

const REVIEWS_READ = 'inv.catalog.product-reviews.read';
const REVIEWS_UPDATE = 'inv.catalog.product-reviews.update';
const REVIEWS_DELETE = 'inv.catalog.product-reviews.delete';

const STATUS_LABEL: Record<ProductReviewStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

type Props = {
  companyId: string;
  partnerId: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`تقييم ${rating} من 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            index < rating
              ? 'h-3.5 w-3.5 fill-amber-500 text-amber-500'
              : 'h-3.5 w-3.5 text-muted-foreground/40'
          }
        />
      ))}
    </span>
  );
}

function PartnerProductReviewsBody({ companyId, partnerId }: Props) {
  const [status, setStatus] = React.useState<ProductReviewStatus | 'all'>('all');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  React.useEffect(() => {
    setPage(1);
  }, [status, partnerId]);

  const { data, isLoading, isError, refetch, isFetching } = useProductReviews(
    {
      companyId,
      partnerId,
      page,
      limit,
      status,
    },
    Boolean(companyId && partnerId),
  );
  const updateReview = useUpdateProductReview();
  const deleteReview = useDeleteProductReview();

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? items.length;
  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);
  const avgRating =
    items.length > 0
      ? items.reduce((sum, review) => sum + review.rating, 0) / items.length
      : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ProductReviewStatus | 'all')}
        >
          <SelectTrigger className="h-9 w-full sm:w-44" aria-label="تصفية الحالة">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="pending">قيد المراجعة</SelectItem>
            <SelectItem value="approved">معتمد</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          تحديث
        </Button>
        {avgRating != null ? (
          <Badge variant="secondary" className="gap-1 tabular-nums">
            <Star className="h-3 w-3 fill-current" />
            {avgRating.toFixed(1)}
          </Badge>
        ) : null}
        <Badge variant="outline" className="tabular-nums">
          {total} تقييم
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          تعذر تحميل التقييمات. تحقق من صلاحية <span dir="ltr">{REVIEWS_READ}</span>.
          <button type="button" className="ms-2 underline" onClick={() => void refetch()}>
            إعادة المحاولة
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <Star className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">لا توجد تقييمات منتجات لهذه الجهة بعد.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-border/80 bg-background/80 px-3.5 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={review.rating} />
                    <Badge variant="subtle">{STATUS_LABEL[review.status] ?? review.status}</Badge>
                    {review.isArchived ? <Badge variant="outline">مؤرشف</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <Link
                      href={ecommerceAdminRoutes.productDetail(review.productId)}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      منتج
                      <span dir="ltr" className="font-mono text-[11px]">
                        {review.productId.slice(0, 8)}…
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {' · '}
                    <span dir="ltr">{new Date(review.createdAt).toLocaleString('ar-YE')}</span>
                  </p>
                  {review.title ? (
                    <p className="text-sm font-medium text-foreground">{review.title}</p>
                  ) : null}
                  {review.body ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Can permission={REVIEWS_UPDATE}>
                    {review.status !== 'approved' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updateReview.isPending}
                        onClick={() =>
                          updateReview.mutate({ id: review.id, patch: { status: 'approved' } })
                        }
                      >
                        <Check className="me-1 h-3.5 w-3.5" />
                        اعتماد
                      </Button>
                    ) : null}
                    {review.status !== 'rejected' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updateReview.isPending}
                        onClick={() =>
                          updateReview.mutate({ id: review.id, patch: { status: 'rejected' } })
                        }
                      >
                        <X className="me-1 h-3.5 w-3.5" />
                        رفض
                      </Button>
                    ) : null}
                  </Can>
                  <Can permission={REVIEWS_DELETE}>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={deleteReview.isPending}
                      onClick={() => {
                        if (window.confirm('أرشفة هذا التقييم؟')) {
                          deleteReview.mutate(review.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Can>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-xs text-muted-foreground tabular-nums">
            صفحة {page} من {totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              السابق
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              التالي
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PartnerProductReviewsPanel({ companyId, partnerId }: Props) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
      <header className="mb-4 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Star className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">تقييمات المنتجات</h2>
          <p className="text-xs text-muted-foreground">
            تقييمات هذه الجهة عبر <span dir="ltr">partnerId</span> على المنتجات.
          </p>
        </div>
      </header>

      <Can
        permission={REVIEWS_READ}
        fallback={
          <p className="text-sm text-muted-foreground">
            لا تملك صلاحية عرض التقييمات (<span dir="ltr">{REVIEWS_READ}</span>).
          </p>
        }
      >
        <PartnerProductReviewsBody companyId={companyId} partnerId={partnerId} />
      </Can>
    </section>
  );
}
