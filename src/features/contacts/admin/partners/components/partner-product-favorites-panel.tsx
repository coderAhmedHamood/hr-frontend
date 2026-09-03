'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink, Heart, Plus, Trash2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  useCreateProductFavorite,
  useDeleteProductFavorite,
  useProductFavorites,
} from '@/features/ecommerce/admin/favorites/hooks/use-product-favorites';
import { ProductSinglePicker } from '@/features/ecommerce/admin/products/components/product-single-picker';
import { ProductLabel } from '@/features/ecommerce/admin/products/components/product-label';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

const FAVORITES_READ = 'inv.catalog.product-favorites.read';
const FAVORITES_CREATE = 'inv.catalog.product-favorites.create';
const FAVORITES_DELETE = 'inv.catalog.product-favorites.delete';

type Props = {
  companyId: string;
  partnerId: string;
};

function PartnerProductFavoritesBody({ companyId, partnerId }: Props) {
  const [page, setPage] = React.useState(1);
  const [addOpen, setAddOpen] = React.useState(false);
  const [productId, setProductId] = React.useState('');
  const limit = 20;

  React.useEffect(() => {
    setPage(1);
  }, [partnerId]);

  const { data, isLoading, isError, refetch, isFetching } = useProductFavorites(
    {
      companyId,
      partnerId,
      page,
      limit,
    },
    Boolean(companyId && partnerId),
  );
  const createFavorite = useCreateProductFavorite();
  const deleteFavorite = useDeleteProductFavorite();

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? items.length;
  const totalPages = Math.max(1, data?.pagination.totalPages ?? 1);
  const favoritedProductIds = React.useMemo(
    () => items.map((item) => item.productId),
    [items],
  );

  async function onAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!productId) return;
    await createFavorite.mutateAsync({ partnerId, productId });
    setAddOpen(false);
    setProductId('');
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          تحديث
        </Button>
        <Badge variant="outline" className="tabular-nums">
          {total} مفضلة
        </Badge>
        <Can permission={FAVORITES_CREATE}>
          <Button
            type="button"
            size="sm"
            className="ms-auto"
            onClick={() => {
              setProductId('');
              setAddOpen(true);
            }}
          >
            <Plus className="me-1 h-3.5 w-3.5" />
            إضافة للمفضلة
          </Button>
        </Can>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          تعذر تحميل المفضلة. تحقق من صلاحية <span dir="ltr">{FAVORITES_READ}</span>.
          <button type="button" className="ms-2 underline" onClick={() => void refetch()}>
            إعادة المحاولة
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <Heart className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">لا توجد منتجات في مفضلة هذه الجهة بعد.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((favorite) => (
            <li
              key={favorite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/80 px-3.5 py-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-foreground">
                  <ProductLabel companyId={companyId} productId={favorite.productId} fallback="منتج" />
                </p>
                <p className="text-xs text-muted-foreground">
                  <Link
                    href={ecommerceAdminRoutes.productDetail(favorite.productId)}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <span dir="ltr" className="font-mono text-[11px]">
                      {favorite.productId.slice(0, 8)}…
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  {' · '}
                  <span dir="ltr">{new Date(favorite.createdAt).toLocaleString('ar-YE')}</span>
                </p>
              </div>
              <Can permission={FAVORITES_DELETE}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={deleteFavorite.isPending}
                  title="حذف صلب من المفضلة"
                  onClick={() => {
                    if (window.confirm('إزالة هذا المنتج من المفضلة؟ (حذف نهائي)')) {
                      deleteFavorite.mutate(favorite.id);
                    }
                  }}
                >
                  <Trash2 className="me-1 h-3.5 w-3.5" />
                  إزالة
                </Button>
              </Can>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة منتج للمفضلة</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void onAdd(e)}>
            <div className="space-y-1.5">
              <Label>المنتج</Label>
              <ProductSinglePicker
                companyId={companyId}
                value={productId}
                excludeIds={favoritedProductIds}
                placeholder="ابحث عن منتج…"
                onChange={setProductId}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createFavorite.isPending || !productId}
              >
                إضافة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PartnerProductFavoritesPanel({ companyId, partnerId }: Props) {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
      <header className="mb-4 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Heart className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">مفضلة المنتجات</h2>
          <p className="text-xs text-muted-foreground">
            منتجات هذه الجهة عبر <span dir="ltr">partnerId</span> — الحذف نهائي بدون أرشفة.
          </p>
        </div>
      </header>

      <Can
        permission={FAVORITES_READ}
        fallback={
          <p className="text-sm text-muted-foreground">
            لا تملك صلاحية عرض المفضلة (<span dir="ltr">{FAVORITES_READ}</span>).
          </p>
        }
      >
        <PartnerProductFavoritesBody companyId={companyId} partnerId={partnerId} />
      </Can>
    </section>
  );
}
