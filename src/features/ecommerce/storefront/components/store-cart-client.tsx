'use client';

import Image from 'next/image';
import { AlertCircle, PackageSearch, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/features/ecommerce/shared/utils/format-price';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { ProductPrice } from '@/features/ecommerce/storefront/components/catalog/product-price';
import { ProductGridSkeleton } from '@/features/ecommerce/storefront/components/catalog/loading-skeleton';
import { QuantitySelector } from '@/features/ecommerce/storefront/components/catalog/quantity-selector';
import { StoreErrorState } from '@/features/ecommerce/storefront/components/catalog/store-error-state';
import { useStorefrontCartProducts } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-products';
import { useStorefrontCartUi } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-ui';
import { useStoreCartCheck } from '@/features/ecommerce/storefront/hooks/use-store-cart-check';
import { cn } from '@/shared/utils';
import {
  buildProductDisplay,
  getOrderQuantityMax,
  resolveDiscountPercent,
  resolveLineCompareAtPrice,
  resolveLineUnitPrice,
} from '@/features/ecommerce/storefront/lib/product-display';
import { StoreEmptyState } from '@/features/ecommerce/storefront/components/store-empty-state';
import { Link } from '@/i18n/navigation';

export function StoreCartClient() {
  const t = useTranslations('storefront');
  const lines = useStorefrontCartUi((s) => s.lines);
  const setQuantity = useStorefrontCartUi((s) => s.setQuantity);
  const removeItem = useStorefrontCartUi((s) => s.removeItem);
  const { data: products, isLoading, isError, refetch } = useStorefrontCartProducts();
  // Lines the server would refuse are shown now, not at the last step.
  const cartCheck = useStoreCartCheck();

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const cartLines = lines
    .map((line) => {
      const product = productById.get(line.productId);
      if (!product) return null;
      const variant = line.variantId
        ? product.variants.find((item) => item.id === line.variantId)
        : undefined;
      const unitPrice = resolveLineUnitPrice(product, variant);
      const compareAt = resolveLineCompareAtPrice(product, unitPrice);
      const discountPercent = resolveDiscountPercent(unitPrice, compareAt);
      const maxQty = getOrderQuantityMax(product, variant);
      const lineName = variant ? variant.nameAr : product.name;
      return { line, product, variant, unitPrice, compareAt, discountPercent, maxQty, lineName };
    })
    .filter(
      (
        entry,
      ): entry is {
        line: (typeof lines)[number];
        product: StorefrontProduct;
        variant: StorefrontProduct['variants'][number] | undefined;
        unitPrice: StorefrontProduct['price'];
        compareAt: StorefrontProduct['compareAtPrice'];
        discountPercent: number | null;
        maxQty: number;
        lineName: string;
      } => Boolean(entry),
    );

  const total = cartLines.reduce((sum, { line, unitPrice }) => sum + unitPrice.amount * line.quantity, 0);

  if (lines.length === 0) {
    return (
      <StoreEmptyState icon={PackageSearch} title={t('cart.empty')} description={t('cart.emptyDescription')}>
        <Link
          href="/store/products"
          prefetch={false}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          {t('cart.continueShopping')}
        </Link>
      </StoreEmptyState>
    );
  }

  if (isLoading) {
    return <ProductGridSkeleton count={3} columns={{ mobile: 1, tablet: 1, desktop: 1 }} />;
  }

  if (isError) {
    return <StoreErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="flex flex-col gap-4">
        {cartLines.map(({ line, product, unitPrice, compareAt, discountPercent, maxQty, lineName, variant }) => {
          const display = buildProductDisplay(product);
          const imageUrl = variant?.imageUrl ?? variant?.images?.[0]?.url ?? display.imageUrl;
          const imageAlt = variant ? lineName : display.imageAlt;
          const rowKey = line.variantId ? `${product.id}::${line.variantId}` : product.id;
          return (
            <li key={rowKey} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {imageUrl ? (
                  <Image src={imageUrl} alt={imageAlt} fill unoptimized sizes="80px" className="object-contain p-1" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <PackageSearch className="h-6 w-6" aria-hidden />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Link href={`/store/products/${product.slug}`} prefetch={false} className="font-medium text-foreground hover:text-primary">
                  {lineName}
                </Link>
                {variant ? (
                  <div className="flex flex-wrap gap-1.5">
                    {variant.attributeLabels.map((label) => (
                      <span
                        key={`${label.attributeNameAr}-${label.valueNameAr}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {label.colorHex ? (
                          <span
                            className="h-2 w-2 rounded-full border border-border bg-[var(--swatch)]"
                            style={{ ['--swatch' as string]: label.colorHex }}
                          />
                        ) : null}
                        {label.valueNameAr}
                      </span>
                    ))}
                  </div>
                ) : null}
                {cartCheck.issueFor(product.id, line.variantId) ? (
                  <p className="flex items-start gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-2 text-xs leading-relaxed text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      {cartCheck.issueFor(product.id, line.variantId)?.message}{' '}
                      <Link
                        href={`/store/products/${product.slug}`}
                        prefetch={false}
                        className="font-semibold underline underline-offset-2"
                      >
                        {t('cart.openProduct')}
                      </Link>
                    </span>
                  </p>
                ) : null}
                <ProductPrice
                  price={formatPrice(unitPrice)}
                  compareAtPrice={compareAt ? formatPrice(compareAt) : undefined}
                  discountPercent={discountPercent}
                  size="sm"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-muted-foreground">{t('cart.quantity')}</span>
                  <QuantitySelector
                    value={line.quantity}
                    max={Math.max(1, maxQty)}
                    onChange={(quantity) => setQuantity(product.id, quantity, line.variantId)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(product.id, line.variantId)}
                    className="ms-auto inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t('cart.remove')}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-arabic-display text-lg font-semibold text-foreground">{t('cart.subtotal')}</h2>
        <p className="mt-2 text-2xl font-bold text-foreground">
          {formatPrice({ amount: total, currency: cartLines[0]?.product.price.currency ?? 'YER' })}
        </p>
        {cartCheck.blocked ? (
          <>
            <button
              type="button"
              disabled
              className="mt-6 flex h-11 w-full cursor-not-allowed items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground opacity-50"
            >
              {t('cart.checkout')}
            </button>
            <p className="mt-2 text-center text-xs font-medium text-destructive">
              {t('cart.fixLinesFirst')}
            </p>
          </>
        ) : (
          <Link
            href="/store/checkout"
            prefetch={false}
            className={cn(
              'mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90',
              cartCheck.checking && 'opacity-80',
            )}
          >
            {t('cart.checkout')}
          </Link>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">{t('cart.checkoutLoginHint')}</p>
        <Link href="/store/products" prefetch={false} className="mt-3 block text-center text-sm text-primary hover:underline">
          {t('cart.continueShopping')}
        </Link>
      </aside>
    </div>
  );
}
