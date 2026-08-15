'use client';

import * as React from 'react';
import { Minus, Package, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/utils';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import type { InventoryStockListItem } from '@/features/inventory/domain/types/product-stock';
import {
  usePosProductStock,
  usePosStockList,
} from '@/features/inventory/admin/pos/hooks/use-pos-stock';
import { usePosSaleDeduct } from '@/features/inventory/admin/pos/hooks/use-pos-sale';

type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  nameAr: string;
  sku: string;
  quantity: number;
  onHand: number;
  trackInventory: boolean;
  /** Optional override — empty means backend uses product warehouse. */
  locationId: string | null;
};

function lineKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? ''}`;
}

function formatQty(value: number) {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function InventoryPosPage() {
  const companyId = getStorefrontCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [inStockOnly, setInStockOnly] = React.useState(true);
  const [posOnly, setPosOnly] = React.useState(true);
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [pendingProductId, setPendingProductId] = React.useState<string | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const stockQuery = usePosStockList({
    companyId,
    search: search || undefined,
    posAvailable: posOnly ? true : undefined,
    inStockOnly,
    page: 1,
    limit: 100,
  });

  const productStockQuery = usePosProductStock(companyId, pendingProductId ?? '', {
    enabled: Boolean(pendingProductId),
  });

  const deduct = usePosSaleDeduct(companyId);

  const items = stockQuery.data?.items ?? [];

  function addSimpleItem(item: InventoryStockListItem) {
    const key = lineKey(item.productId, item.variantId);
    setCart((prev) => {
      const existing = prev.find((line) => line.key === key);
      if (existing) {
        return prev.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: item.productId,
          variantId: item.variantId,
          nameAr: item.nameAr,
          sku: item.sku,
          quantity: 1,
          onHand: item.onHand,
          trackInventory: item.trackInventory,
          locationId: null,
        },
      ];
    });
  }

  function handlePickItem(item: InventoryStockListItem) {
    if (item.variantId) {
      addSimpleItem(item);
      return;
    }
    setPendingProductId(item.productId);
  }

  React.useEffect(() => {
    if (!pendingProductId || productStockQuery.isLoading || !productStockQuery.data) return;
    const snapshot = productStockQuery.data;
    const listItem = (stockQuery.data?.items ?? []).find(
      (row) => row.productId === pendingProductId && !row.variantId,
    );

    if (snapshot.displayLevel === 'variant' && snapshot.variants.length > 1) {
      // Wait for explicit variant pick in the UI.
      return;
    }

    if (snapshot.displayLevel === 'variant' && snapshot.variants.length === 1) {
      const variant = snapshot.variants[0]!;
      const key = lineKey(pendingProductId, variant.variantId);
      setCart((prev) => {
        const existing = prev.find((line) => line.key === key);
        if (existing) {
          return prev.map((line) =>
            line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
          );
        }
        return [
          ...prev,
          {
            key,
            productId: pendingProductId,
            variantId: variant.variantId,
            nameAr: variant.nameAr || listItem?.nameAr || 'متغير',
            sku: variant.sku || listItem?.sku || '',
            quantity: 1,
            onHand: variant.onHand,
            trackInventory: snapshot.trackInventory,
            locationId: null,
          },
        ];
      });
      setPendingProductId(null);
      return;
    }

    const key = lineKey(pendingProductId, null);
    setCart((prev) => {
      const existing = prev.find((line) => line.key === key);
      if (existing) {
        return prev.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: pendingProductId,
          variantId: null,
          nameAr: listItem?.nameAr ?? 'منتج',
          sku: listItem?.sku ?? '',
          quantity: 1,
          onHand: snapshot.onHand,
          trackInventory: snapshot.trackInventory,
          locationId: null,
        },
      ];
    });
    setPendingProductId(null);
  }, [
    pendingProductId,
    productStockQuery.isLoading,
    productStockQuery.data,
    stockQuery.data?.items,
  ]);

  function pickVariant(variantId: string) {
    if (!pendingProductId || !productStockQuery.data) return;
    const snapshot = productStockQuery.data;
    const variant = snapshot.variants.find((row) => row.variantId === variantId);
    if (!variant) return;
    const key = lineKey(pendingProductId, variant.variantId);
    setCart((prev) => {
      const existing = prev.find((line) => line.key === key);
      if (existing) {
        return prev.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: pendingProductId,
          variantId: variant.variantId,
          nameAr: variant.nameAr,
          sku: variant.sku,
          quantity: 1,
          onHand: variant.onHand,
          trackInventory: snapshot.trackInventory,
          locationId: null,
        },
      ];
    });
    setPendingProductId(null);
  }

  function setQty(key: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((line) => (line.key === key ? { ...line, quantity: Math.max(0, quantity) } : line))
        .filter((line) => line.quantity > 0),
    );
  }

  function setLineLocation(key: string, locationId: string | null) {
    setCart((prev) =>
      prev.map((line) => (line.key === key ? { ...line, locationId } : line)),
    );
  }

  function clearCart() {
    setCart([]);
  }

  async function confirmSale() {
    if (cart.length === 0 || deduct.isPending) return;
    const sourceDocument = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}`;
    try {
      await deduct.mutateAsync({
        sourceDocument,
        notes: 'خصم نقطة بيع محلية',
        lines: cart.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          ...(line.locationId ? { locationId: line.locationId } : {}),
        })),
      });
      clearCart();
      searchRef.current?.focus();
    } catch {
      /* toast handled in mutation */
    }
  }

  const totalUnits = cart.reduce((sum, line) => sum + line.quantity, 0);
  const pendingVariants =
    pendingProductId &&
    productStockQuery.data?.displayLevel === 'variant' &&
    (productStockQuery.data.variants.length ?? 0) > 1
      ? productStockQuery.data.variants.filter((v) => v.isActive)
      : null;

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle
        titleAr="نقطة البيع — خصم كمية"
        descriptionAr="كاشير بسيط لخصم الكمية من مخزون المستودع. لا دفع ولا فواتير — فقط مزامنة الكمية مع المتجر الإلكتروني."
        iconName="Store"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        {/* Catalog */}
        <section className="flex min-h-[28rem] flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1 space-y-1.5">
              <Label htmlFor="pos-search">بحث / باركود</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  id="pos-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="اسم، SKU، أو باركود…"
                  className="ps-8"
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && items.length === 1) {
                      event.preventDefault();
                      handlePickItem(items[0]!);
                      setSearchInput('');
                    }
                  }}
                />
              </div>
            </div>
            <Button
              type="button"
              variant={posOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPosOnly((value) => !value)}
            >
              {posOnly ? 'POS فقط' : 'كل المنتجات'}
            </Button>
            <Button
              type="button"
              variant={inStockOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInStockOnly((value) => !value)}
            >
              {inStockOnly ? 'متوفر فقط' : 'كل الأرصدة'}
            </Button>
          </div>

          {pendingVariants ? (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="mb-2 text-sm font-medium">اختر المتغير</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {pendingVariants.map((variant) => (
                  <button
                    key={variant.variantId}
                    type="button"
                    onClick={() => pickVariant(variant.variantId)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-start hover:border-primary"
                  >
                    <div className="text-sm font-medium">{variant.nameAr}</div>
                    <div className="text-xs text-muted-foreground">
                      {variant.sku} · رصيد {formatQty(variant.onHand)}
                    </div>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setPendingProductId(null)}
              >
                إلغاء
              </Button>
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto">
            {stockQuery.isLoading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">جاري التحميل…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Package className="h-8 w-8 opacity-40" />
                <p className="text-sm">لا توجد أصناف</p>
                <p className="text-xs">
                  {posOnly
                    ? 'فعّل «متاح لنقطة البيع» على المنتج، أو اضغط «كل المنتجات»'
                    : 'جرّب بحثاً آخر أو ألغِ فلتر المتوفر فقط'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {items.map((item) => {
                  const key = lineKey(item.productId, item.variantId);
                  const inCart = cart.find((line) => line.key === key);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => handlePickItem(item)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-muted/50',
                          inCart && 'bg-primary/5',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{item.nameAr}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {item.sku}
                            {item.barcode ? ` · ${item.barcode}` : ''}
                          </div>
                        </div>
                        <div className="shrink-0 text-end">
                          <div className="text-sm font-semibold tabular-nums">
                            {formatQty(item.onHand)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">رصيد</div>
                        </div>
                        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Cart */}
        <section className="flex min-h-[28rem] flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4" />
              سلة الخصم
              {totalUnits > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {totalUnits}
                </span>
              ) : null}
            </div>
            {cart.length > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="me-1 h-3.5 w-3.5" />
                تفريغ
              </Button>
            ) : null}
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 opacity-40" />
              <p className="text-sm">اختر أصنافاً من القائمة</p>
            </div>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
              {cart.map((line) => (
                <CartLineRow
                  key={line.key}
                  line={line}
                  companyId={companyId}
                  onQty={(qty) => setQty(line.key, qty)}
                  onLocation={(locationId) => setLineLocation(line.key, locationId)}
                  onRemove={() => setQty(line.key, 0)}
                />
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              بدون اختيار موقع يُخصم من مستودع المنتج الافتراضي. الكمية تظهر فوراً في المتجر.
            </p>
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || deduct.isPending}
              onClick={() => void confirmSale()}
            >
              {deduct.isPending ? 'جاري الخصم…' : `تأكيد الخصم (${totalUnits})`}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function CartLineRow({
  line,
  companyId,
  onQty,
  onLocation,
  onRemove,
}: {
  line: CartLine;
  companyId: string;
  onQty: (quantity: number) => void;
  onLocation: (locationId: string | null) => void;
  onRemove: () => void;
}) {
  const stockQuery = usePosProductStock(companyId, line.productId, { enabled: true });
  const locations = stockQuery.data?.locations ?? [];

  return (
    <li className="rounded-lg border border-border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{line.nameAr}</div>
          <div className="text-xs text-muted-foreground">
            {line.sku}
            {line.trackInventory ? ` · رصيد ${formatQty(line.onHand)}` : ' · بلا تتبع'}
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onQty(line.quantity - 1)}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          type="number"
          min={1}
          step={1}
          value={line.quantity}
          onChange={(event) => onQty(Number(event.target.value) || 0)}
          className="h-8 w-16 text-center tabular-nums"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onQty(line.quantity + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {locations.length > 0 ? (
        <div className="mt-2 space-y-1">
          <Label className="text-xs text-muted-foreground">موقع الخروج (اختياري)</Label>
          <Select
            value={line.locationId ?? '__product__'}
            onValueChange={(value) => onLocation(value === '__product__' ? null : value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="مستودع المنتج" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__product__">مستودع المنتج (افتراضي)</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.locationId} value={location.locationId}>
                  {location.locationCode || location.locationNameAr}
                  {location.warehouseCode ? ` · ${location.warehouseCode}` : ''}
                  {` (${formatQty(location.onHand)})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </li>
  );
}
