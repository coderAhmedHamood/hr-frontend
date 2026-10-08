'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Barcode, ImageOff, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import {
  DEMO_POS_PRODUCTS,
  fetchPosProducts,
  fetchPosVariants,
  resolvePosScan,
  type PosCatalogProduct,
  type PosCatalogVariant,
} from '@/features/pos/lib/pos-catalog';
import { formatAmount } from '@/features/pos/lib/format';

export type PickedItem = {
  product: PosCatalogProduct;
  variant: PosCatalogVariant | null;
};

/**
 * Search, scan and pick. A scan (Enter in the search box) is an exact match on
 * barcode or SKU — locally first, then the products app's resolver.
 */
export function ProductPanel({
  companyId,
  onlyPosAvailable,
  disabled,
  onPick,
}: {
  companyId: string;
  onlyPosAvailable: boolean;
  disabled: boolean;
  onPick: (item: PickedItem) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [useDemo, setUseDemo] = React.useState(false);
  const [variantFor, setVariantFor] = React.useState<{ product: PosCatalogProduct; variants: PosCatalogVariant[] } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const variantsCache = React.useRef(new Map<string, PosCatalogVariant[]>());
  const inputRef = React.useRef<HTMLInputElement>(null);

  const products = useQuery({
    queryKey: ['pos', 'products', companyId, onlyPosAvailable],
    queryFn: () => fetchPosProducts(companyId, { onlyPosAvailable }),
    staleTime: 60_000,
    enabled: !useDemo,
  });

  const list = useDemo ? DEMO_POS_PRODUCTS : (products.data ?? []);
  const q = query.trim().toLowerCase();
  const visible = q
    ? list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode ?? '').toLowerCase() === q)
    : list;

  React.useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const variantsOf = async (product: PosCatalogProduct): Promise<PosCatalogVariant[]> => {
    if (useDemo) return [];
    const cached = variantsCache.current.get(product.id);
    if (cached) return cached;
    const v = await fetchPosVariants(companyId, product.id).catch(() => []);
    variantsCache.current.set(product.id, v);
    return v;
  };

  const pickProduct = async (product: PosCatalogProduct) => {
    if (disabled) return;
    setBusy(true);
    try {
      const variants = await variantsOf(product);
      if (variants.length === 0) onPick({ product, variant: null });
      else if (variants.length === 1) onPick({ product, variant: variants[0]! });
      else setVariantFor({ product, variants });
    } finally {
      setBusy(false);
    }
  };

  const scan = async () => {
    const code = query.trim();
    if (!code || disabled) return;
    const local = list.find((p) => (p.barcode ?? '') === code || p.sku.toLowerCase() === code.toLowerCase());
    if (local) {
      setQuery('');
      return pickProduct(local);
    }
    if (useDemo) {
      toast.error('لا صنف بهذا الرمز');
      return;
    }
    setBusy(true);
    try {
      const hit = await resolvePosScan(companyId, code);
      if (!hit) {
        toast.error('لا صنف بهذا الرمز');
        return;
      }
      const product = list.find((p) => p.id === hit.productId);
      if (!product) {
        toast.error('الصنف غير متاح في نقطة البيع');
        return;
      }
      setQuery('');
      if (hit.variantId) {
        const variants = await variantsOf(product);
        const variant = variants.find((v) => v.id === hit.variantId) ?? null;
        onPick({ product, variant });
      } else {
        await pickProduct(product);
      }
    } catch {
      toast.error('تعذّر البحث بالرمز');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void scan();
            }
          }}
          disabled={disabled}
          placeholder="ابحث بالاسم أو امسح الباركود ثم Enter"
          className="h-12 ps-9 pe-10 text-base"
        />
        {busy ? (
          <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Barcode className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {products.isLoading && !useDemo ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            جاري تحميل الأصناف…
          </div>
        ) : (products.isError || list.length === 0) && !useDemo ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            {products.isError ? 'تعذّر تحميل الأصناف من تطبيق المنتجات.' : 'لا أصناف قابلة للبيع.'}
            <Button size="sm" variant="outline" onClick={() => setUseDemo(true)}>
              عرض أصناف تجريبية للتصميم
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
            {visible.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => void pickProduct(p)}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-start shadow-soft transition hover:border-primary/50 hover:shadow-md disabled:opacity-50"
              >
                <div className="flex h-24 items-center justify-center overflow-hidden bg-muted/50">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveUploadUrl(p.imageUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 p-2">
                  <span className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</span>
                  <span className="text-xs text-muted-foreground" dir="ltr">{p.sku}</span>
                  <span className="mt-auto text-sm font-bold tabular-nums text-primary">{formatAmount(p.price)}</span>
                </div>
              </button>
            ))}
            {visible.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">لا نتائج.</p>
            ) : null}
          </div>
        )}
      </div>

      <Dialog open={!!variantFor} onOpenChange={(o) => !o && setVariantFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{variantFor?.product.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {variantFor?.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onPick({ product: variantFor.product, variant: v });
                  setVariantFor(null);
                }}
                className="rounded-lg border border-border p-3 text-start hover:border-primary/50 hover:bg-muted/40"
              >
                <div className="text-sm font-medium">{v.name}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">{v.sku}</div>
                <div className="mt-1 text-sm font-bold text-primary">{formatAmount(v.price ?? variantFor.product.price)}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
