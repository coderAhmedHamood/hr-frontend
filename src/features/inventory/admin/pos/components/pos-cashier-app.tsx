'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  LayoutGrid,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { STORE_CURRENCY_CODE } from '@/features/ecommerce/domain/constants/store-currency';
import type { Product } from '@/features/ecommerce/domain/types/product';
import { useAllCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { usePosSaleDeduct } from '../hooks/use-pos-sale';
import { usePosStockList } from '../hooks/use-pos-stock';

type CartLine = {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  unitPrice: number;
  qty: number;
  maxQty: number;
};

const PAGE_SIZE = 48;

function productThumb(p: Product): string | null {
  const media = p.media ?? [];
  const primary = media.find((m) => m.isPrimary) ?? media[0];
  return primary?.url ?? null;
}

export function PosCashierApp() {
  const companyId = getStorefrontCompanyId();
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [searchDebounced, setSearchDebounced] = React.useState('');
  const [locationId, setLocationId] = React.useState<string | undefined>();
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data: categoriesData, isLoading: catsLoading } = useAllCategories(companyId);
  const categories = categoriesData?.items ?? [];
  const { data: locationsPage } = useWarehouseLocations({ companyId, limit: 500 });
  const locations = locationsPage?.items ?? [];

  const stockQuery = usePosStockList({
    companyId,
    locationId,
    page: 1,
    limit: 500,
  });

  const byProductId = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stockQuery.data?.items ?? []) {
      if (row.variantId) continue;
      map.set(row.productId, (map.get(row.productId) ?? 0) + row.onHand);
    }
    return map;
  }, [stockQuery.data?.items]);

  const productQuery = React.useMemo(
    () => ({
      companyId,
      page: 1,
      limit: PAGE_SIZE,
      categoryId: categoryId ?? undefined,
      search: searchDebounced || undefined,
      // Do not filter posAvailable — most catalog products default to false in admin forms.
      sort: 'createdAt' as const,
      sortDirection: 'desc' as const,
    }),
    [companyId, categoryId, searchDebounced],
  );

  const {
    data: productsPage,
    isLoading: productsLoading,
    isFetching,
    isError: productsError,
    error: productsErrorObj,
    refetch: refetchProducts,
  } = useProducts(productQuery);
  const products = productsPage?.items ?? [];

  const deduct = usePosSaleDeduct(companyId);

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cart.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const qtyOnHand = React.useCallback(
    (productId: string, fallback?: number) => {
      const fromStock = byProductId.get(productId);
      if (fromStock != null) return fromStock;
      return fallback ?? 0;
    },
    [byProductId],
  );

  const addProduct = React.useCallback(
    (p: Product) => {
      const available = qtyOnHand(p.id, p.inventory?.quantity ?? 0);
      if (available <= 0) {
        toast.error('لا يتوفر مخزون لهذا المنتج');
        return;
      }
      setCart((prev) => {
        const i = prev.findIndex((l) => l.productId === p.id && !l.variantId);
        if (i >= 0) {
          const next = [...prev];
          const line = next[i]!;
          if (line.qty >= available) {
            toast.error(`الحد الأقصى المتاح: ${available}`);
            return prev;
          }
          next[i] = { ...line, qty: line.qty + 1, maxQty: available };
          return next;
        }
        return [
          ...prev,
          {
            productId: p.id,
            variantId: null,
            name: p.nameAr || p.nameEn || p.sku || p.id.slice(0, 8),
            sku: p.sku,
            unitPrice: p.price?.amount ?? 0,
            qty: 1,
            maxQty: available,
          },
        ];
      });
    },
    [qtyOnHand],
  );

  const setLineQty = (productId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l;
          const max = qtyOnHand(productId, l.maxQty) || l.maxQty;
          const next = Math.min(Math.max(0, qty), max);
          return { ...l, qty: next, maxQty: max };
        })
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setConfirmOpen(false);
  };

  const handleConfirmDeduct = async () => {
    if (cart.length === 0) return;
    try {
      await deduct.mutateAsync({
        locationId: locationId ?? null,
        lines: cart.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.qty,
        })),
        notes: 'بيع كاشير (POS)',
        sourceDocument: `POS-${Date.now()}`,
      });
      clearCart();
      void stockQuery.refetch();
    } catch {
      /* toast in hook */
    }
  };

  const rootCategories = React.useMemo(
    () =>
      categories
        .filter((c) => !c.parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [categories],
  );

  /** When a root or its child is selected, show that root's subcategories. */
  const subcategoryParentId = React.useMemo(() => {
    if (!categoryId) return null;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return null;
    return cat.parentId ?? cat.id;
  }, [categories, categoryId]);

  const childCategories = React.useMemo(() => {
    if (!subcategoryParentId) return [];
    return categories
      .filter((c) => c.parentId === subcategoryParentId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categories, subcategoryParentId]);

  const railRootCategory = categories.find((c) => c.id === subcategoryParentId);
  const totalProducts = productsPage?.pagination?.total ?? products.length;

  return (
    <div className="flex h-dvh flex-col bg-[#e8ecf1] text-slate-900" dir="rtl">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-3 text-white">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          التطبيقات
        </Link>
        <Link
          href={inventoryAdminRoutes.overview}
          className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white sm:inline-flex"
        >
          المخزون
        </Link>
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-emerald-400" />
          <span className="text-base font-semibold tracking-tight">كاشير البيع</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <MapPin className="size-3.5 text-slate-400" />
          <Select
            value={locationId ?? '__all__'}
            onValueChange={(v) => setLocationId(v === '__all__' ? undefined : v)}
          >
            <SelectTrigger className="h-8 w-[220px] border-slate-600 bg-slate-800 text-xs text-white">
              <SelectValue placeholder="كل المواقع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">كل المواقع (افتراضي المنتج)</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.nameAr}
                  {loc.code ? ` · ${loc.code}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[min(100%,380px)] shrink-0 flex-col border-e border-slate-300 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">الفاتورة الحالية</p>
              <p className="text-xs text-slate-500">{cartCount} قطعة</p>
            </div>
            {cart.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:text-rose-700"
                onClick={clearCart}
              >
                تفريغ
              </Button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
                <Package className="size-10 opacity-40" />
                <p className="text-sm">اضغط على بطاقة المنتج لإضافته</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cart.map((line) => (
                  <li key={line.productId} className="flex gap-2 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{line.name}</p>
                      {line.sku ? (
                        <p className="font-mono text-[10px] text-slate-400">{line.sku}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatPrice({
                          amount: line.unitPrice,
                          currency: STORE_CURRENCY_CODE,
                        })}{' '}
                        × {line.qty}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center rounded-md border border-slate-200">
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center text-slate-600 hover:bg-slate-50"
                          onClick={() => setLineQty(line.productId, line.qty - 1)}
                          aria-label="إنقاص"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center text-slate-600 hover:bg-slate-50"
                          onClick={() => setLineQty(line.productId, line.qty + 1)}
                          aria-label="زيادة"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatPrice({
                          amount: line.qty * line.unitPrice,
                          currency: STORE_CURRENCY_CODE,
                        })}
                      </p>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-rose-600"
                        onClick={() => removeLine(line.productId)}
                        aria-label="حذف"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="shrink-0 space-y-3 border-t border-slate-200 bg-slate-50 p-4">
            <div className="flex items-end justify-between">
              <span className="text-sm text-slate-600">الإجمالي</span>
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                {formatPrice({ amount: cartTotal, currency: STORE_CURRENCY_CODE })}
              </span>
            </div>
            {!confirmOpen ? (
              <Button
                type="button"
                size="lg"
                className="h-14 w-full rounded-xl bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
                disabled={cart.length === 0 || deduct.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                تأكيد الخصم من المخزون
              </Button>
            ) : (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-950">
                  خصم {cartCount} قطعة — لا يمكن التراجع من هذه الشاشة
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={deduct.isPending}
                    onClick={() => setConfirmOpen(false)}
                  >
                    <X className="size-4" />
                    إلغاء
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={deduct.isPending}
                    onClick={() => void handleConfirmDeduct()}
                  >
                    {deduct.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    تأكيد
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-slate-300 bg-white px-3 py-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث اختياري بالاسم أو SKU…"
                  className="h-10 border-slate-200 bg-slate-50 pe-3 ps-10"
                />
              </div>
              {(stockQuery.isLoading || isFetching) && (
                <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" />
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className={cn(
                  'inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition',
                  categoryId === null
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                )}
              >
                <LayoutGrid className="size-4" />
                الكل
              </button>
              {catsLoading ? (
                <span className="flex h-11 items-center px-2 text-xs text-slate-400">
                  جاري الأقسام…
                </span>
              ) : (
                rootCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      'inline-flex h-11 max-w-[160px] shrink-0 items-center truncate rounded-xl px-4 text-sm font-medium transition',
                      categoryId === cat.id ||
                        categories.some((c) => c.id === categoryId && c.parentId === cat.id)
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    )}
                    title={cat.nameAr}
                  >
                    {cat.nameAr}
                  </button>
                ))
              )}
            </div>

            {childCategories.length > 0 ? (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                <span className="flex h-8 shrink-0 items-center text-xs text-slate-500">
                  {railRootCategory?.nameAr}:
                </span>
                {childCategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setCategoryId(sub.id)}
                    className={cn(
                      'h-8 shrink-0 rounded-lg px-3 text-xs font-medium ring-1',
                      categoryId === sub.id
                        ? 'bg-emerald-600 text-white ring-emerald-700'
                        : 'bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100',
                    )}
                  >
                    {sub.nameAr}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {productsLoading && products.length === 0 ? (
              <div className="flex h-48 items-center justify-center gap-2 text-slate-500">
                <Loader2 className="size-5 animate-spin" />
                جاري تحميل المنتجات…
              </div>
            ) : productsError ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-500">
                <Package className="size-10 text-rose-400 opacity-80" />
                <p className="text-sm font-medium text-rose-700">تعذّر جلب المنتجات</p>
                <p className="max-w-md text-center text-xs text-slate-500">
                  {productsErrorObj instanceof Error
                    ? productsErrorObj.message
                    : 'تحقق من الاتصال بالخادم ثم أعد المحاولة'}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => void refetchProducts()}>
                  إعادة المحاولة
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-500">
                <Package className="size-10 opacity-40" />
                <p className="text-sm">لا توجد منتجات في هذا القسم</p>
                {categoryId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCategoryId(null)}
                  >
                    عرض الكل
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {products.map((p) => {
                  const thumb = productThumb(p);
                  const stock = qtyOnHand(p.id, p.inventory?.quantity ?? 0);
                  const inCart = cart.find((l) => l.productId === p.id)?.qty ?? 0;
                  const out = stock <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={out}
                      onClick={() => addProduct(p)}
                      className={cn(
                        'group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-start shadow-sm transition',
                        out
                          ? 'cursor-not-allowed border-slate-200 opacity-50'
                          : 'border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.98]',
                        inCart > 0 && 'ring-2 ring-emerald-500',
                      )}
                    >
                      <div className="relative aspect-square bg-slate-50">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            className="size-full object-contain p-2"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="size-12 text-slate-300" />
                          </div>
                        )}
                        <span className="absolute end-2 top-2 rounded-md bg-slate-900/90 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                          {formatPrice({
                            amount: p.price?.amount ?? 0,
                            currency: p.price?.currency || STORE_CURRENCY_CODE,
                          })}
                        </span>
                        {inCart > 0 ? (
                          <span className="absolute start-2 top-2 flex size-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                            {inCart}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5 border-t border-slate-100 p-2.5">
                        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-slate-800">
                          {p.nameAr || p.nameEn || '—'}
                        </p>
                        <p
                          className={cn(
                            'text-xs tabular-nums',
                            out
                              ? 'text-rose-600'
                              : stock <= 5
                                ? 'text-amber-600'
                                : 'text-slate-500',
                          )}
                        >
                          {out ? 'نفد المخزون' : `متاح: ${stock}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {totalProducts > PAGE_SIZE ? (
              <p className="mt-4 text-center text-xs text-slate-500">
                يُعرض أول {PAGE_SIZE} منتجاً من {totalProducts} — ضيّق بالقسم أو البحث
              </p>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
