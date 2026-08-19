'use client';

import * as React from 'react';
import { Check, Star, Trash2, X } from 'lucide-react';
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
  ProductFormSection,
} from '@/features/ecommerce/admin/products/components/product-form-section';
import {
  useDeleteProductReview,
  useProductReviews,
  useUpdateProductReview,
} from '@/features/ecommerce/admin/reviews/hooks/use-product-reviews';
import type { ProductReviewStatus } from '@/features/ecommerce/admin/reviews/lib/api/product-reviews-api';

const REVIEWS_READ = 'inv.catalog.product-reviews.read';
const REVIEWS_UPDATE = 'inv.catalog.product-reviews.update';
const REVIEWS_DELETE = 'inv.catalog.product-reviews.delete';

const STATUS_LABEL: Record<ProductReviewStatus, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'معتمد',
  rejected: 'ملغى التفعيل',
};

type Props = {
  companyId: string;
  productId: string;
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

export function ProductReviewsTab({ companyId, productId }: Props) {
  const [status, setStatus] = React.useState<ProductReviewStatus | 'all'>('all');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  React.useEffect(() => {
    setPage(1);
  }, [status, productId]);

  const { data, isLoading, isError, refetch, isFetching } = useProductReviews({
    companyId,
    productId,
    page,
    limit,
    status,
    archiveScope: 'active',
  });
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
    <Can
      permission={REVIEWS_READ}
      fallback={
        <ProductFormSection title="التقييمات" description="مراجعات العملاء لهذا المنتج.">
          <p className="text-sm text-muted-foreground">
            لا تملك صلاحية عرض التقييمات (
            <span dir="ltr">{REVIEWS_READ}</span>).
          </p>
        </ProductFormSection>
      }
    >
      <ProductFormSection
        title="تقييمات هذا المنتج"
        description="تُجلب من Inventory عبر GET /inventory/product-reviews?productId=…"
        action={
          <div className="flex flex-wrap items-center gap-2">
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
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ProductReviewStatus | 'all')}
          >
            <SelectTrigger className="h-9 w-44" aria-label="تصفية الحالة">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="pending">بانتظار المراجعة</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="rejected">ملغى التفعيل</SelectItem>
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
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            تعذر تحميل التقييمات. تحقق من صلاحية{' '}
            <span dir="ltr">{REVIEWS_READ}</span>.
            <button type="button" className="ms-2 underline" onClick={() => void refetch()}>
              إعادة المحاولة
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
            <Star className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">لا توجد تقييمات لهذا المنتج بعد.</p>
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
                      {review.guestName || (review.partnerId ? 'شريك مسجّل' : 'بدون اسم')} ·{' '}
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
                          title="إلغاء التفعيل — يبقى ظاهرًا بحالة rejected"
                          onClick={() =>
                            updateReview.mutate({ id: review.id, patch: { status: 'rejected' } })
                          }
                        >
                          <X className="me-1 h-3.5 w-3.5" />
                          إلغاء التفعيل
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
                        title="أرشفة ناعمة"
                        onClick={() => {
                          if (
                            window.confirm(
                              'أرشفة هذا التقييم؟ سيُخفى من القائمة النشطة.',
                            )
                          ) {
                            deleteReview.mutate(review.id);
                          }
                        }}
                      >
                        <Trash2 className="me-1 h-3.5 w-3.5" />
                        أرشفة
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
      </ProductFormSection>
    </Can>
  );
}
