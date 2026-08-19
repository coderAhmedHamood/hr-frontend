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
import { cn } from '@/shared/utils';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import { STORE_CURRENCY_CODE } from '@/features/ecommerce/domain/constants/store-currency';
import type { Product } from '@/features/ecommerce/domain/types/product';
import type { Category } from '@/features/ecommerce/domain/types/category';
import { useAllCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import type { InventoryStockListItem } from '@/features/inventory/domain/types/product-stock';
import type { WarehouseLocation } from '@/features/inventory/domain/types/warehouse';
import { usePosSaleDeduct } from '../hooks/use-pos-sale';
import { usePosStockList } from '../hooks/use-pos-stock';

const LOCATION_SESSION_KEY = 'pos.cashier.locationId';
const STOCK_PAGE_SIZE = 200;
const PRODUCT_ENRICH_LIMIT = 500;

type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  unitPrice: number;
  qty: number;
  maxQty: number;
};

type PosTile = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  onHand: number;
  unitPrice: number;
  thumb: string | null;
  categoryId: string | null;
};

function lineKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? ''}`;
}

function productThumb(p: Product | undefined): string | null {
  if (!p) return null;
  const media = p.media ?? [];
  const primary = media.find((m) => m.isPrimary) ?? media[0];
  return primary?.url ?? null;
}

function categoryMatches(
  productCategoryId: string | null | undefined,
  selectedId: string | null,
  categories: Category[],
): boolean {
  if (!selectedId) return true;
  if (!productCategoryId) return false;
  if (productCategoryId === selectedId) return true;
  const byId = new Map(categories.map((c) => [c.id, c]));
  let current = byId.get(productCategoryId);
  while (current?.parentId) {
    if (current.parentId === selectedId) return true;
    current = byId.get(current.parentId);
  }
  return false;
}

function readStoredLocationId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(LOCATION_SESSION_KEY);
  } catch {
    return null;
  }
}

function writeStoredLocationId(locationId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (locationId) sessionStorage.setItem(LOCATION_SESSION_KEY, locationId);
    else sessionStorage.removeItem(LOCATION_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function LocationGate({
  locations,
  warehouseNameById,
  isLoading,
  onSelect,
}: {
  locations: WarehouseLocation[];
  warehouseNameById: Map<string, string>;
  isLoading: boolean;
  onSelect: (locationId: string) => void;
}) {
  const [q, setQ] = React.useState('');
  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return locations;
    return locations.filter((loc) => {
      const wh = warehouseNameById.get(loc.warehouseId) ?? '';
      return (
        loc.nameAr.toLowerCase().includes(term) ||
        loc.code.toLowerCase().includes(term) ||
        wh.toLowerCase().includes(term)
      );
    });
  }, [locations, q, warehouseNameById]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, WarehouseLocation[]>();
    for (const loc of filtered) {
      const list = map.get(loc.warehouseId) ?? [];
      list.push(loc);
      map.set(loc.warehouseId, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="inventory-app flex h-dvh flex-col bg-[#e8ecf1]" dir="rtl">
      <header className="inv-pos-header flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-3 py-2 text-white">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          التطبيقات
        </Link>
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-emerald-400" />
          <span className="text-base font-semibold tracking-tight">اختيار موقع الكاشير</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">اختر الموقع أولاً</h1>
          <p className="mt-1 text-sm text-slate-500">
            شاشة الكاشير مربوطة بموقع واحد — تُعرض كميات هذا الموقع فقط ويُخصم منها عند البيع.
          </p>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث باسم الموقع أو الكود أو المستودع…"
              className="h-11 pe-3 ps-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-slate-500">
            <Loader2 className="size-5 animate-spin" />
            جاري تحميل المواقع…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
            <Package className="size-10 opacity-40" />
            <p className="text-sm">لا توجد مواقع داخلية نشطة</p>
          </div>
        ) : (
          <div className="space-y-5 pb-8">
            {grouped.map(([warehouseId, locs]) => (
              <section key={warehouseId} className="space-y-2">
                <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {warehouseNameById.get(warehouseId) ?? 'مستودع'}
                </h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {locs.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => onSelect(loc.id)}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-emerald-400 hover:shadow-md active:scale-[0.99]"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <MapPin className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {loc.nameAr}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-slate-400">{loc.code}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PosCashierApp() {
  const companyId = getStorefrontCompanyId();
  const [locationId, setLocationId] = React.useState<string | null>(null);
  const [locationReady, setLocationReady] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [searchDebounced, setSearchDebounced] = React.useState('');
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    setLocationId(readStoredLocationId());
    setLocationReady(true);
  }, []);

  React.useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search.trim()), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data: categoriesData, isLoading: catsLoading } = useAllCategories(companyId, {
    enabled: Boolean(locationId),
  });
  const categories = categoriesData?.items ?? [];

  const { data: locationsPage, isLoading: locationsLoading } = useWarehouseLocations({
    companyId,
    limit: 500,
  });
  const { data: warehousesPage } = useWarehouses({ companyId, limit: 200 });

  const locations = React.useMemo(
    () =>
      (locationsPage?.items ?? []).filter(
        (loc) => loc.isActive && loc.locationType === 'internal',
      ),
    [locationsPage?.items],
  );

  const warehouseNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const wh of warehousesPage?.items ?? []) {
      map.set(wh.id, wh.nameAr);
    }
    return map;
  }, [warehousesPage?.items]);

  const selectedLocation = locations.find((l) => l.id === locationId) ?? null;

  React.useEffect(() => {
    if (!locationReady || !locationId) return;
    if (locationsLoading) return;
    if (locations.length > 0 && !locations.some((l) => l.id === locationId)) {
      setLocationId(null);
      writeStoredLocationId(null);
    }
  }, [locationReady, locationId, locations, locationsLoading]);

  const selectLocation = (id: string) => {
    setLocationId(id);
    writeStoredLocationId(id);
    setCart([]);
    setConfirmOpen(false);
    setCategoryId(null);
    setSearch('');
  };

  const changeLocation = () => {
    setLocationId(null);
    writeStoredLocationId(null);
    setCart([]);
    setConfirmOpen(false);
  };

  const stockQuery = usePosStockList(
    {
      companyId,
      locationId: locationId ?? undefined,
      search: searchDebounced || undefined,
      inStockOnly: true,
      page: 1,
      limit: STOCK_PAGE_SIZE,
    },
    { enabled: Boolean(locationId) },
  );

  const enrichQuery = useProducts({
    companyId,
    page: 1,
    limit: PRODUCT_ENRICH_LIMIT,
    sort: 'createdAt',
    sortDirection: 'desc',
  });

  const productById = React.useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of enrichQuery.data?.items ?? []) {
      map.set(p.id, p);
    }
    return map;
  }, [enrichQuery.data?.items]);

  const tiles = React.useMemo((): PosTile[] => {
    const rows = stockQuery.data?.items ?? [];
    return rows
      .map((row: InventoryStockListItem) => {
        const product = productById.get(row.productId);
        return {
          key: lineKey(row.productId, row.variantId),
          productId: row.productId,
          variantId: row.variantId,
          name: row.nameAr || row.nameEn || row.sku || row.productId.slice(0, 8),
          sku: row.sku,
          onHand: row.onHand,
          unitPrice: product?.price?.amount ?? 0,
          thumb: productThumb(product),
          categoryId: product?.categoryId ?? null,
        };
      })
      .filter((tile) => categoryMatches(tile.categoryId, categoryId, categories));
  }, [stockQuery.data?.items, productById, categoryId, categories]);

  const deduct = usePosSaleDeduct(companyId);

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cart.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const addTile = React.useCallback((tile: PosTile) => {
    if (tile.onHand <= 0) {
      toast.error('لا يتوفر مخزون لهذا المنتج في الموقع');
      return;
    }
    setCart((prev) => {
      const i = prev.findIndex((l) => l.key === tile.key);
      if (i >= 0) {
        const next = [...prev];
        const line = next[i]!;
        if (line.qty >= tile.onHand) {
          toast.error(`الحد الأقصى في هذا الموقع: ${tile.onHand}`);
          return prev;
        }
        next[i] = { ...line, qty: line.qty + 1, maxQty: tile.onHand };
        return next;
      }
      return [
        ...prev,
        {
          key: tile.key,
          productId: tile.productId,
          variantId: tile.variantId,
          name: tile.name,
          sku: tile.sku,
          unitPrice: tile.unitPrice,
          qty: 1,
          maxQty: tile.onHand,
        },
      ];
    });
  }, []);

  const setLineQty = (key: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.key !== key) return l;
          const next = Math.min(Math.max(0, qty), l.maxQty);
          return { ...l, qty: next };
        })
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  };

  const clearCart = () => {
    setCart([]);
    setConfirmOpen(false);
  };

  const handleConfirmDeduct = async () => {
    if (!locationId || cart.length === 0) return;
    try {
      await deduct.mutateAsync({
        locationId,
        lines: cart.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.qty,
          locationId,
        })),
        notes: `بيع كاشير — موقع ${selectedLocation?.nameAr ?? locationId}`,
        sourceDocument: `POS-${selectedLocation?.code ?? 'LOC'}-${Date.now()}`,
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

  if (!locationReady) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#e8ecf1]" dir="rtl">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!locationId) {
    return (
      <LocationGate
        locations={locations}
        warehouseNameById={warehouseNameById}
        isLoading={locationsLoading}
        onSelect={selectLocation}
      />
    );
  }

  const stockLoading = stockQuery.isLoading || stockQuery.isFetching;
  const stockError = stockQuery.isError;

  return (
    <div className="flex h-dvh flex-col bg-[#e8ecf1] text-slate-900 inventory-app" dir="rtl">
      <header className="inv-pos-header flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900 px-3 py-2 text-white">
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
          <button
            type="button"
            onClick={changeLocation}
            className="inv-pos-location inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs text-white transition hover:bg-slate-700"
            title="تغيير الموقع"
          >
            <MapPin className="size-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">
              {selectedLocation?.nameAr ?? 'موقع'}
              {selectedLocation?.code ? ` · ${selectedLocation.code}` : ''}
            </span>
          </button>
        </div>
      </header>

      <div className="inv-pos-shell">
        <aside className="inv-pos-cart flex flex-col border-e border-slate-300 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">الفاتورة الحالية</p>
              <p className="text-xs text-slate-500">
                {cartCount} قطعة · خصم من {selectedLocation?.nameAr ?? 'الموقع'}
              </p>
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
                  <li key={line.key} className="flex gap-2 px-3 py-3">
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
                          onClick={() => setLineQty(line.key, line.qty - 1)}
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
                          onClick={() => setLineQty(line.key, line.qty + 1)}
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
                        onClick={() => removeLine(line.key)}
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
                تأكيد الخصم من الموقع
              </Button>
            ) : (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-950">
                  خصم {cartCount} قطعة من «{selectedLocation?.nameAr}» — لا يمكن التراجع من هذه
                  الشاشة
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

        <main className="inv-pos-catalog flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-slate-300 bg-white px-3 py-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث اختياري بالاسم أو SKU ضمن هذا الموقع…"
                  className="h-10 border-slate-200 bg-slate-50 pe-3 ps-10"
                />
              </div>
              {stockLoading && (
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
                      'inv-pos-chip inline-flex h-11 shrink-0 items-center truncate rounded-xl px-4 text-sm font-medium transition',
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
            {stockLoading && tiles.length === 0 ? (
              <div className="flex h-48 items-center justify-center gap-2 text-slate-500">
                <Loader2 className="size-5 animate-spin" />
                جاري تحميل مخزون الموقع…
              </div>
            ) : stockError ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-500">
                <Package className="size-10 text-rose-400 opacity-80" />
                <p className="text-sm font-medium text-rose-700">تعذّر جلب مخزون الموقع</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void stockQuery.refetch()}
                >
                  إعادة المحاولة
                </Button>
              </div>
            ) : tiles.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-500">
                <Package className="size-10 opacity-40" />
                <p className="text-sm">لا توجد كميات في هذا الموقع</p>
                {categoryId || searchDebounced ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCategoryId(null);
                      setSearch('');
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {tiles.map((tile) => {
                  const inCart = cart.find((l) => l.key === tile.key)?.qty ?? 0;
                  const out = tile.onHand <= 0;
                  return (
                    <button
                      key={tile.key}
                      type="button"
                      disabled={out}
                      onClick={() => addTile(tile)}
                      className={cn(
                        'group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-start shadow-sm transition',
                        out
                          ? 'cursor-not-allowed border-slate-200 opacity-50'
                          : 'border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.98]',
                        inCart > 0 && 'ring-2 ring-emerald-500',
                      )}
                    >
                      <div className="relative aspect-square bg-slate-50">
                        {tile.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tile.thumb}
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
                            amount: tile.unitPrice,
                            currency: STORE_CURRENCY_CODE,
                          })}
                        </span>
                        {inCart > 0 ? (
                          <span className="absolute start-2 top-2 flex size-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                            {inCart}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5 border-t border-slate-100 p-2.5">
                        <p className="line-clamp-2 min-h-10 text-sm font-medium leading-snug text-slate-800">
                          {tile.name}
                        </p>
                        <p
                          className={cn(
                            'text-xs tabular-nums',
                            out
                              ? 'text-rose-600'
                              : tile.onHand <= 5
                                ? 'text-amber-600'
                                : 'text-slate-500',
                          )}
                        >
                          {out ? 'نفد في الموقع' : `متاح هنا: ${tile.onHand}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {(stockQuery.data?.pagination?.total ?? 0) > STOCK_PAGE_SIZE ? (
              <p className="mt-4 text-center text-xs text-slate-500">
                يُعرض أول {STOCK_PAGE_SIZE} صنفاً من{' '}
                {stockQuery.data?.pagination?.total} في هذا الموقع — استخدم البحث للتضييق
              </p>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
