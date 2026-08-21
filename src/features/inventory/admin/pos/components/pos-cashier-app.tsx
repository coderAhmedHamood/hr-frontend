'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  ChevronUp,
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
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
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
import type {
  InventoryStockListItem,
  ProductStockSnapshot,
} from '@/features/inventory/domain/types/product-stock';
import type { WarehouseLocation } from '@/features/inventory/domain/types/warehouse';
import { usePosSaleDeduct } from '../hooks/use-pos-sale';
import { usePosProductStock, usePosStockList } from '../hooks/use-pos-stock';

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

function productThumb(p: Product | undefined, variantId?: string | null): string | null {
  if (!p) return null;
  if (variantId) {
    const variant = p.variants?.find((v) => v.id === variantId);
    const variantUrl = variant?.imageUrl ?? variant?.images?.[0]?.url;
    if (variantUrl) {
      const resolved = resolveUploadUrl(variantUrl);
      if (resolved) return resolved;
    }
  }
  const media = p.media ?? [];
  const primary = media.find((m) => m.isPrimary) ?? media[0];
  const url = primary?.url;
  if (!url) return null;
  const resolved = resolveUploadUrl(url);
  return resolved || null;
}

function resolveUnitPrice(product: Product | undefined, variantId: string | null): number {
  if (!product) return 0;
  if (variantId) {
    const variant = product.variants?.find((v) => v.id === variantId);
    if (variant) return variant.salePrice.amount;
  }
  return product.price.amount;
}

function buildPosTile(
  row: InventoryStockListItem,
  product: Product | undefined,
): PosTile {
  return {
    key: lineKey(row.productId, row.variantId),
    productId: row.productId,
    variantId: row.variantId,
    name: row.nameAr || row.nameEn || row.sku || row.productId.slice(0, 8),
    sku: row.sku,
    onHand: row.onHand,
    unitPrice: resolveUnitPrice(product, row.variantId),
    thumb: productThumb(product, row.variantId),
    categoryId: product?.categoryId ?? null,
  };
}

type PosVariantChoice = {
  variantId: string;
  nameAr: string;
  sku: string;
  onHand: number;
};

/** Variants with onHand > 0 at the selected location — empty means use product-level stock. */
function resolveAvailableVariants(
  productId: string,
  product: Product | undefined,
  snapshot: ProductStockSnapshot | undefined,
  onHandAtLocation: (productId: string, variantId: string | null) => number,
): PosVariantChoice[] {
  const snapshotVariants = snapshot?.variants.filter((v) => v.isActive) ?? [];
  const catalogVariants = product?.variants?.filter((v) => v.isActive) ?? [];

  const rows =
    snapshot?.displayLevel === 'variant' && snapshotVariants.length > 0
      ? snapshotVariants.map((v) => ({
          variantId: v.variantId,
          nameAr: v.nameAr,
          sku: v.sku,
        }))
      : catalogVariants.map((v) => ({
          variantId: v.id,
          nameAr: v.nameAr,
          sku: v.sku,
        }));

  return rows
    .map((row) => ({
      ...row,
      onHand: onHandAtLocation(productId, row.variantId),
    }))
    .filter((row) => row.onHand > 0);
}

function findProductLevelStockRow(
  productId: string,
  stockRowsByProduct: Map<string, InventoryStockListItem[]>,
): InventoryStockListItem | undefined {
  const rows = stockRowsByProduct.get(productId) ?? [];
  return rows.find((row) => !row.variantId) ?? rows[0];
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
          <span className="text-base font-semibold tracking-tight">اختيار موقع الخصم</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">اختر الموقع أولاً</h1>
          <p className="mt-1 text-sm text-slate-500">
            الشاشة مربوطة بموقع واحد — تُعرض كميات هذا الموقع فقط ويُخصم منها عند تسجيل البيع.
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

function PosCartPanel({
  cart,
  cartCount,
  cartTotal,
  confirmOpen,
  setConfirmOpen,
  selectedLocation,
  deductPending,
  onClear,
  onConfirm,
  onSetQty,
  onRemove,
  onClose,
  className,
}: {
  cart: CartLine[];
  cartCount: number;
  cartTotal: number;
  confirmOpen: boolean;
  setConfirmOpen: (open: boolean) => void;
  selectedLocation: WarehouseLocation | null;
  deductPending: boolean;
  onClear: () => void;
  onConfirm: () => void;
  onSetQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {onClose ? (
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">الفاتورة</p>
            <p className="text-xs text-slate-500">
              {cartCount} قطعة · {selectedLocation?.nameAr ?? 'الموقع'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="إغلاق"
          >
            <ChevronUp className="size-5" />
          </button>
        </div>
      ) : (
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
              onClick={onClear}
            >
              تفريغ
            </Button>
          ) : null}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-6 text-center text-slate-400">
            <Package className="size-10 opacity-40" />
            <p className="text-sm">اضغط على بطاقة المنتج لإضافته</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {cart.map((line) => (
              <li key={line.key} className="flex gap-3 px-3 py-3">
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
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button
                      type="button"
                      className="flex size-11 items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                      onClick={() => onSetQty(line.key, line.qty - 1)}
                      aria-label="إنقاص"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold tabular-nums">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      className="flex size-11 items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                      onClick={() => onSetQty(line.key, line.qty + 1)}
                      aria-label="زيادة"
                    >
                      <Plus className="size-4" />
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
                    className="flex size-9 items-center justify-center text-slate-400 hover:text-rose-600"
                    onClick={() => onRemove(line.key)}
                    aria-label="حذف"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="inv-pos-cart-footer shrink-0 space-y-3 border-t border-slate-200 bg-slate-50 p-4">
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
            className="h-14 w-full touch-manipulation rounded-xl bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
            disabled={cart.length === 0 || deductPending}
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
                className="h-12 flex-1 touch-manipulation"
                disabled={deductPending}
                onClick={() => setConfirmOpen(false)}
              >
                <X className="size-4" />
                إلغاء
              </Button>
              <Button
                type="button"
                className="h-12 flex-1 touch-manipulation bg-emerald-600 hover:bg-emerald-700"
                disabled={deductPending}
                onClick={() => void onConfirm()}
              >
                {deductPending ? (
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
    </div>
  );
}

function VariantPickerSheet({
  open,
  productName,
  variants,
  loading,
  onPick,
  onClose,
}: {
  open: boolean;
  productName: string;
  variants: Array<{ variantId: string; nameAr: string; sku: string; onHand: number }>;
  loading: boolean;
  onPick: (variantId: string) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[min(85dvh,32rem)] w-full flex-col rounded-t-2xl bg-white shadow-xl md:max-w-md md:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-variant-picker-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0 pe-2">
            <p id="pos-variant-picker-title" className="truncate text-sm font-semibold text-slate-900">
              اختر المتغير
            </p>
            <p className="truncate text-xs text-slate-500">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {loading ? (
            <div className="flex h-32 items-center justify-center gap-2 text-slate-500">
              <Loader2 className="size-5 animate-spin" />
              جاري تحميل المتغيرات…
            </div>
          ) : variants.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">لا توجد متغيرات متاحة في هذا الموقع</p>
          ) : (
            <ul className="space-y-2">
              {variants.map((variant) => (
                <li key={variant.variantId}>
                  <button
                    type="button"
                    onClick={() => onPick(variant.variantId)}
                    className="flex w-full touch-manipulation items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-start transition hover:border-emerald-400 hover:bg-emerald-50/50 active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{variant.nameAr}</p>
                      {variant.sku ? (
                        <p className="font-mono text-[10px] text-slate-400">{variant.sku}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-emerald-700">
                      متاح: {variant.onHand}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
  const [mobileCartOpen, setMobileCartOpen] = React.useState(false);
  const [pendingProductId, setPendingProductId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileCartOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileCartOpen]);

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

  const productStockQuery = usePosProductStock(companyId, pendingProductId ?? '', {
    enabled: Boolean(pendingProductId),
  });

  const stockRowsByProduct = React.useMemo(() => {
    const map = new Map<string, InventoryStockListItem[]>();
    for (const row of stockQuery.data?.items ?? []) {
      const list = map.get(row.productId) ?? [];
      list.push(row);
      map.set(row.productId, list);
    }
    return map;
  }, [stockQuery.data?.items]);

  const onHandAtLocation = React.useCallback(
    (productId: string, variantId: string | null) => {
      const rows = stockRowsByProduct.get(productId) ?? [];
      if (variantId) {
        return rows.find((row) => row.variantId === variantId)?.onHand ?? 0;
      }
      return rows.find((row) => !row.variantId)?.onHand ?? rows[0]?.onHand ?? 0;
    },
    [stockRowsByProduct],
  );

  const tiles = React.useMemo((): PosTile[] => {
    const rows = stockQuery.data?.items ?? [];
    const productsWithVariantRows = new Set(
      rows.filter((row) => row.variantId).map((row) => row.productId),
    );
    return rows
      .filter((row) => {
        if (row.variantId) return true;
        return !productsWithVariantRows.has(row.productId);
      })
      .map((row) => buildPosTile(row, productById.get(row.productId)))
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

  const addVariantLine = React.useCallback(
    (productId: string, variantId: string) => {
      const product = productById.get(productId);
      const snapshot = productStockQuery.data;
      const snapshotVariant = snapshot?.variants.find((row) => row.variantId === variantId);
      const catalogVariant = product?.variants?.find((row) => row.id === variantId);
      const onHand = onHandAtLocation(productId, variantId);
      const tile: PosTile = {
        key: lineKey(productId, variantId),
        productId,
        variantId,
        name:
          snapshotVariant?.nameAr ||
          catalogVariant?.nameAr ||
          product?.nameAr ||
          'متغير',
        sku: snapshotVariant?.sku || catalogVariant?.sku || product?.sku || '',
        onHand,
        unitPrice: resolveUnitPrice(product, variantId),
        thumb: productThumb(product, variantId),
        categoryId: product?.categoryId ?? null,
      };
      addTile(tile);
      setPendingProductId(null);
    },
    [addTile, onHandAtLocation, productById, productStockQuery.data],
  );

  const addProductLevelFromStock = React.useCallback(
    (productId: string) => {
      const product = productById.get(productId);
      const listRow = findProductLevelStockRow(productId, stockRowsByProduct);
      if (listRow && listRow.onHand > 0) {
        addTile(buildPosTile(listRow, product));
        return true;
      }
      toast.error('لا يتوفر مخزون لهذا المنتج في الموقع');
      return false;
    },
    [addTile, productById, stockRowsByProduct],
  );

  const handleTileClick = React.useCallback(
    (tile: PosTile) => {
      if (tile.variantId) {
        addTile(tile);
        return;
      }
      const product = productById.get(tile.productId);
      const hasVariants = (product?.variants?.filter((v) => v.isActive).length ?? 0) > 0;
      if (!hasVariants) {
        addTile(tile);
        return;
      }

      const available = resolveAvailableVariants(
        tile.productId,
        product,
        undefined,
        onHandAtLocation,
      );

      if (available.length === 0) {
        if (tile.onHand > 0) addTile(tile);
        else toast.error('لا يتوفر مخزون لهذا المنتج في الموقع');
        return;
      }
      if (available.length === 1) {
        addVariantLine(tile.productId, available[0]!.variantId);
        return;
      }
      setPendingProductId(tile.productId);
    },
    [addTile, addVariantLine, onHandAtLocation, productById],
  );

  React.useEffect(() => {
    if (!pendingProductId || productStockQuery.isLoading) return;

    const product = productById.get(pendingProductId);
    const available = resolveAvailableVariants(
      pendingProductId,
      product,
      productStockQuery.data ?? undefined,
      onHandAtLocation,
    );

    if (available.length === 0) {
      addProductLevelFromStock(pendingProductId);
      setPendingProductId(null);
      return;
    }

    if (available.length === 1) {
      addVariantLine(pendingProductId, available[0]!.variantId);
      return;
    }
  }, [
    addProductLevelFromStock,
    addVariantLine,
    onHandAtLocation,
    pendingProductId,
    productById,
    productStockQuery.data,
    productStockQuery.isLoading,
  ]);

  const pendingVariantChoices = React.useMemo(() => {
    if (!pendingProductId || productStockQuery.isLoading) return null;
    const product = productById.get(pendingProductId);
    const available = resolveAvailableVariants(
      pendingProductId,
      product,
      productStockQuery.data ?? undefined,
      onHandAtLocation,
    );
    return available.length > 1 ? available : null;
  }, [onHandAtLocation, pendingProductId, productById, productStockQuery.data, productStockQuery.isLoading]);

  const showVariantPicker = Boolean(pendingProductId && pendingVariantChoices);

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
    setMobileCartOpen(false);
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
        notes: `خصم مبيعات — موقع ${selectedLocation?.nameAr ?? locationId}`,
        sourceDocument: `SALE-${selectedLocation?.code ?? 'LOC'}-${Date.now()}`,
      });
      clearCart();
      void stockQuery.refetch();
    } catch {
      /* toast in hook */
    }
  };

  const cartPanelProps = {
    cart,
    cartCount,
    cartTotal,
    confirmOpen,
    setConfirmOpen,
    selectedLocation,
    deductPending: deduct.isPending,
    onClear: clearCart,
    onConfirm: handleConfirmDeduct,
    onSetQty: setLineQty,
    onRemove: removeLine,
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
      <header className="inv-pos-header flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900 px-2 py-2 text-white sm:gap-3 sm:px-3">
        <Link
          href="/"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white sm:size-auto sm:gap-1.5 sm:px-2 sm:py-1"
          aria-label="التطبيقات"
        >
          <ArrowLeft className="size-5 sm:size-4" />
          <span className="hidden text-sm sm:inline">التطبيقات</span>
        </Link>
        <Link
          href={inventoryAdminRoutes.overview}
          className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white sm:inline-flex"
        >
          المخزون
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingBag className="size-5 shrink-0 text-emerald-400" />
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">خصم المبيعات</span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={changeLocation}
            className="inv-pos-location inline-flex max-w-[9rem] items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-xs text-white transition hover:bg-slate-700 sm:max-w-none sm:px-2.5 sm:py-1.5"
            title="تغيير الموقع"
          >
            <MapPin className="size-4 shrink-0 text-emerald-400 sm:size-3.5" />
            <span className="truncate">
              {selectedLocation?.nameAr ?? 'موقع'}
              {selectedLocation?.code ? ` · ${selectedLocation.code}` : ''}
            </span>
          </button>
        </div>
      </header>

      <div className="inv-pos-shell">
        <aside className="inv-pos-cart hidden flex-col border-e border-slate-300 bg-white shadow-sm md:flex">
          <PosCartPanel {...cartPanelProps} />
        </aside>

        <main className="inv-pos-catalog flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-slate-300 bg-white px-3 py-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو SKU…"
                  className="h-11 border-slate-200 bg-slate-50 pe-3 ps-10 text-base sm:h-10 sm:text-sm"
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
              <div className="grid grid-cols-2 gap-2.5 p-1 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {tiles.map((tile) => {
                  const inCart = cart.find((l) => l.key === tile.key)?.qty ?? 0;
                  const out = tile.onHand <= 0;
                  return (
                    <button
                      key={tile.key}
                      type="button"
                      disabled={out}
                      onClick={() => handleTileClick(tile)}
                      className={cn(
                        'group relative flex touch-manipulation flex-col overflow-hidden rounded-2xl border bg-white text-start shadow-sm transition',
                        out
                          ? 'cursor-not-allowed border-slate-200 opacity-50'
                          : 'border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.97]',
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

      <div className="inv-pos-mobile-bar fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="flex w-full touch-manipulation items-center gap-3 px-4 py-3 text-start"
        >
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <ShoppingBag className="size-5" />
            {cartCount > 0 ? (
              <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">
              {cartCount > 0 ? `${cartCount} قطعة في الفاتورة` : 'الفاتورة فارغة'}
            </span>
            <span className="block text-xs text-slate-500">
              {cartCount > 0
                ? formatPrice({ amount: cartTotal, currency: STORE_CURRENCY_CODE })
                : 'اضغط لعرض الفاتورة'}
            </span>
          </span>
          <ChevronUp className="size-5 shrink-0 text-slate-400" />
        </button>
      </div>

      {mobileCartOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-label="الفاتورة">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            aria-label="إغلاق"
            onClick={() => {
              setMobileCartOpen(false);
              setConfirmOpen(false);
            }}
          />
          <div className="inv-pos-mobile-sheet absolute inset-x-0 bottom-0 flex max-h-[min(92dvh,40rem)] flex-col rounded-t-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 justify-center py-2">
              <span className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <PosCartPanel
              {...cartPanelProps}
              onClose={() => {
                setMobileCartOpen(false);
                setConfirmOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}

      <VariantPickerSheet
        open={showVariantPicker}
        productName={productById.get(pendingProductId ?? '')?.nameAr ?? 'منتج'}
        variants={pendingVariantChoices ?? []}
        loading={Boolean(pendingProductId && productStockQuery.isLoading)}
        onPick={(variantId) => {
          if (!pendingProductId) return;
          addVariantLine(pendingProductId, variantId);
        }}
        onClose={() => setPendingProductId(null)}
      />
    </div>
  );
}
