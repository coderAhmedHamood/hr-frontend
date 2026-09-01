'use client';

import * as React from 'react';
import { Archive, Check, Plus, Star, Trash2, X } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Can } from '@/components/shared/can';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateProductReview,
  useDeleteProductReview,
  useProductReviews,
  useUpdateProductReview,
} from '@/features/ecommerce/admin/reviews/hooks/use-product-reviews';
import type {
  ProductReviewStatus,
} from '@/features/ecommerce/admin/reviews/lib/api/product-reviews-api';
import { ProductSinglePicker } from '@/features/ecommerce/admin/products/components/product-single-picker';
import { ProductLabel } from '@/features/ecommerce/admin/products/components/product-label';

const REVIEWS_READ = 'inv.catalog.product-reviews.read';
const REVIEWS_UPDATE = 'inv.catalog.product-reviews.update';
const REVIEWS_DELETE = 'inv.catalog.product-reviews.delete';

const STATUS_LABEL: Record<ProductReviewStatus, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'معتمد',
  rejected: 'ملغى التفعيل',
};

type ArchiveScope = 'active' | 'archived' | 'all';

export function ProductReviewsAdminPage() {
  const can = useCan();
  const companyId = getStorefrontCompanyId();
  const [status, setStatus] = React.useState<ProductReviewStatus | 'all'>('all');
  const [archiveScope, setArchiveScope] = React.useState<ArchiveScope>('active');
  const [productFilter, setProductFilter] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);

  const canRead = can(REVIEWS_READ);
  const canUpdate = can(REVIEWS_UPDATE);
  const canDelete = can(REVIEWS_DELETE);

  const listQuery = {
    page: 1,
    limit: 50,
    companyId: companyId || undefined,
    status,
    productId: productFilter || undefined,
    archiveScope,
  };
  const { data, isLoading, isError, refetch } = useProductReviews(listQuery, canRead);
  const createReview = useCreateProductReview();
  const updateReview = useUpdateProductReview();
  const deleteReview = useDeleteProductReview();

  const [form, setForm] = React.useState({
    productId: '',
    rating: '5',
    title: '',
    body: '',
    guestName: '',
    status: 'approved' as ProductReviewStatus,
  });

  function resetForm() {
    setForm({
      productId: '',
      rating: '5',
      title: '',
      body: '',
      guestName: '',
      status: 'approved',
    });
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    const rating = Number(form.rating);
    if (!form.productId || !Number.isFinite(rating) || rating < 1 || rating > 5) return;
    await createReview.mutateAsync({
      productId: form.productId,
      rating,
      title: form.title || null,
      body: form.body || null,
      guestName: form.guestName || null,
      status: form.status,
    });
    setCreateOpen(false);
    resetForm();
  }

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="مراجعة التقييمات"
        descriptionAr="اعتماد أو إلغاء تفعيل التقييمات، أو أرشفتها. المعتمدة فقط تدخل في متوسط التقييم وعدد المراجعات على المنتج."
        iconName="Star"
      />

      {!canRead ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          لا تملك صلاحية عرض التقييمات ({REVIEWS_READ}).
        </div>
      ) : (
        <>
          <div className="flex w-full flex-wrap items-end gap-3">
            <div className="sto-filter-field space-y-1.5">
              <Label>الحالة</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ProductReviewStatus | 'all')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">بانتظار المراجعة</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">ملغى التفعيل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sto-filter-field space-y-1.5">
              <Label>الأرشفة</Label>
              <Select
                value={archiveScope}
                onValueChange={(value) => setArchiveScope(value as ArchiveScope)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">النشطة</SelectItem>
                  <SelectItem value="archived">المؤرشفة</SelectItem>
                  <SelectItem value="all">الكل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sto-filter-field space-y-1.5">
              <Label>المنتج</Label>
              <ProductSinglePicker
                companyId={companyId}
                value={productFilter}
                allowClear
                placeholder="كل المنتجات"
                onChange={setProductFilter}
              />
            </div>
            <Can permission={REVIEWS_UPDATE}>
              <Button
                className="ms-auto"
                onClick={() => {
                  resetForm();
                  setCreateOpen(true);
                }}
              >
                <Plus className="me-1.5 h-4 w-4" />
                إضافة تقييم
              </Button>
            </Can>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm">
              <p className="text-destructive">
                تعذر تحميل التقييمات. تحقق من صلاحية {REVIEWS_READ}.
              </p>
              <button
                type="button"
                className="mt-2 text-primary underline"
                onClick={() => refetch()}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (data?.items.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-6 py-12 text-center">
              <Star className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">لا توجد تقييمات ضمن هذا الفلتر.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data!.items.map((review) => {
                const isArchived = review.isArchived || archiveScope === 'archived';
                return (
                  <li
                    key={review.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">
                            <ProductLabel companyId={companyId} productId={review.productId} />
                          </p>
                          <Badge variant="subtle">
                            {STATUS_LABEL[review.status] ?? review.status}
                          </Badge>
                          {isArchived ? (
                            <Badge variant="outline" className="gap-1">
                              <Archive className="h-3 w-3" />
                              مؤرشف
                            </Badge>
                          ) : null}
                          <span className="inline-flex items-center gap-0.5 text-sm text-secondary">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {review.rating}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {review.guestName || (review.partnerId ? 'شريك مسجّل' : 'بدون اسم')} ·{' '}
                          <span dir="ltr">
                            {new Date(review.createdAt).toLocaleString('ar-YE')}
                          </span>
                        </p>
                        {review.title ? (
                          <p className="text-sm font-medium text-foreground">{review.title}</p>
                        ) : null}
                        {review.body ? (
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {review.body}
                          </p>
                        ) : null}
                      </div>

                      {!isArchived ? (
                        <div className="flex flex-wrap gap-1.5">
                          {canUpdate && review.status !== 'approved' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateReview.isPending}
                              onClick={() =>
                                updateReview.mutate({
                                  id: review.id,
                                  patch: { status: 'approved' },
                                })
                              }
                            >
                              <Check className="me-1 h-3.5 w-3.5" />
                              اعتماد
                            </Button>
                          ) : null}
                          {canUpdate && review.status !== 'rejected' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateReview.isPending}
                              title="إلغاء التفعيل — يبقى ظاهرًا في اللوحة بحالة rejected"
                              onClick={() =>
                                updateReview.mutate({
                                  id: review.id,
                                  patch: { status: 'rejected' },
                                })
                              }
                            >
                              <X className="me-1 h-3.5 w-3.5" />
                              إلغاء التفعيل
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={deleteReview.isPending}
                              title="أرشفة ناعمة — إخفاء من القائمة النشطة"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    'أرشفة هذا التقييم؟ سيُخفى من القائمة النشطة ويمكن عرضه عبر فلتر المؤرشفة.',
                                  )
                                ) {
                                  deleteReview.mutate(review.id);
                                }
                              }}
                            >
                              <Trash2 className="me-1 h-3.5 w-3.5" />
                              أرشفة
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة تقييم منتج</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void onCreate(e)}>
            <div className="space-y-1.5">
              <Label>المنتج</Label>
              <ProductSinglePicker
                companyId={companyId}
                value={form.productId}
                placeholder="ابحث عن منتج…"
                onChange={(value) => setForm((prev) => ({ ...prev, productId: value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>التقييم (1–5)</Label>
                <Select
                  value={form.rating}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, rating: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['5', '4', '3', '2', '1'].map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الحالة</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, status: value as ProductReviewStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">معتمد</SelectItem>
                    <SelectItem value="pending">بانتظار المراجعة</SelectItem>
                    <SelectItem value="rejected">ملغى التفعيل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>اسم الضيف</Label>
              <Input
                value={form.guestName}
                onChange={(e) => setForm((prev) => ({ ...prev, guestName: e.target.value }))}
                placeholder="مثال: سارة"
              />
            </div>
            <div className="space-y-1.5">
              <Label>العنوان</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>التعليق</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createReview.isPending || !form.productId}>
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
