'use client';

import * as React from 'react';
import { Check, Plus, Star, Trash2, X } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
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
import type { ProductReviewStatus } from '@/features/ecommerce/admin/reviews/lib/api/product-reviews-api';
import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { useQuery } from '@tanstack/react-query';

const STATUS_LABEL: Record<ProductReviewStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

export function ProductReviewsAdminPage() {
  const companyId = getStorefrontCompanyId();
  const [status, setStatus] = React.useState<ProductReviewStatus | 'all'>('all');
  const [productFilter, setProductFilter] = React.useState('all');
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data: productsPage } = useQuery({
    queryKey: ['ecommerce', 'products', 'for-reviews', companyId],
    queryFn: () => productsApi.getAll({ companyId, page: 1, limit: 200 }),
    enabled: Boolean(companyId),
  });

  const listQuery = {
    page: 1,
    limit: 100,
    status,
    productId: productFilter === 'all' ? undefined : productFilter,
  };
  const { data, isLoading, isError, refetch } = useProductReviews(listQuery);
  const createReview = useCreateProductReview();
  const updateReview = useUpdateProductReview();
  const deleteReview = useDeleteProductReview();

  const productNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of productsPage?.items ?? []) {
      map.set(p.id, p.nameAr || p.sku);
    }
    return map;
  }, [productsPage?.items]);

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
      productId: productsPage?.items[0]?.id ?? '',
      rating: '5',
      title: '',
      body: '',
      guestName: '',
      status: 'approved',
    });
  }

  React.useEffect(() => {
    if (!form.productId && productsPage?.items[0]?.id) {
      setForm((prev) => ({ ...prev, productId: productsPage.items[0]!.id }));
    }
  }, [productsPage?.items, form.productId]);

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
        titleAr="تقييمات المنتجات"
        descriptionAr="إدارة تقييمات العملاء المعروضة في المتجر — الإنشاء والاعتماد عبر Inventory."
        iconName="Star"
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>الحالة</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ProductReviewStatus | 'all')}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">قيد المراجعة</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>المنتج</Label>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="كل المنتجات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المنتجات</SelectItem>
              {(productsPage?.items ?? []).map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm">
          <p className="text-destructive">تعذر تحميل التقييمات. تحقق من صلاحية product-reviews.</p>
          <button type="button" className="mt-2 text-primary underline" onClick={() => refetch()}>
            إعادة المحاولة
          </button>
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <Star className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">لا توجد تقييمات بعد.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data!.items.map((review) => (
            <li key={review.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">
                      {productNameById.get(review.productId) || review.productId.slice(0, 8)}
                    </p>
                    <Badge variant="subtle">{STATUS_LABEL[review.status] ?? review.status}</Badge>
                    <span className="inline-flex items-center gap-0.5 text-sm text-secondary">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {review.rating}
                    </span>
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
                  {review.status !== 'approved' ? (
                    <Button
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
                  <Button
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
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة تقييم منتج</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void onCreate(e)}>
            <div className="space-y-1.5">
              <Label>المنتج</Label>
              <Select
                value={form.productId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, productId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر منتجاً" />
                </SelectTrigger>
                <SelectContent>
                  {(productsPage?.items ?? []).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
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
