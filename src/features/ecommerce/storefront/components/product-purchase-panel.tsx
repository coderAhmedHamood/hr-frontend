'use client';

import * as React from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';
import { buildCombinationKey } from '@/features/ecommerce/admin/products/lib/product-variants';
import { AddToCartButton } from '@/features/ecommerce/storefront/components/catalog/add-to-cart-button';
import { cn } from '@/shared/utils';

type Props = {
  product: StorefrontProduct;
};

export function ProductPurchasePanel({ product }: Props) {
  const t = useTranslations('storefront');
  const format = useFormatter();

  const hasVariants = product.variants.length > 0;
  const [selected, setSelected] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const attribute of product.attributes) {
      const first = attribute.values[0];
      if (first) initial[attribute.id] = first.id;
    }
    return initial;
  });

  const selectedValueIds = product.attributes.map((attribute) => selected[attribute.id]).filter(Boolean);
  const activeVariant = hasVariants
    ? product.variants.find(
        (variant) => variant.combinationKey === buildCombinationKey(selectedValueIds),
      )
    : undefined;

  const price = activeVariant?.price ?? product.price;
  const stockStatus = activeVariant?.stockStatus ?? product.stockStatus;
  const quantity = activeVariant?.quantity ?? product.inventory.quantity;
  const canOrder = stockStatus === 'in_stock' || stockStatus === 'preorder';
  const sku = activeVariant?.sku ?? product.sku;

  function selectValue(attributeId: string, valueId: string) {
    setSelected((prev) => ({ ...prev, [attributeId]: valueId }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-foreground">
          {format.number(price.amount, { style: 'currency', currency: price.currency })}
        </span>
        {!hasVariants && product.compareAtPrice ? (
          <span className="text-base text-muted-foreground line-through">
            {format.number(product.compareAtPrice.amount, {
              style: 'currency',
              currency: product.compareAtPrice.currency,
            })}
          </span>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {t('products.sku')}: <span dir="ltr">{sku}</span>
        {hasVariants ? (
          <span className="ms-2">· {t('cart.quantity')}: {quantity}</span>
        ) : null}
      </p>

      <p
        className={
          canOrder ? 'text-sm font-medium text-success' : 'text-sm font-medium text-muted-foreground'
        }
      >
        {t(`stock.${stockStatus}`)}
      </p>

      {product.attributes.map((attribute) => (
        <div key={attribute.id} className="space-y-2">
          <p className="text-sm font-medium text-foreground">{attribute.nameAr}</p>
          <div className="flex flex-wrap gap-2">
            {attribute.values.map((value) => {
              const isSelected = selected[attribute.id] === value.id;
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => selectValue(attribute.id, value.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10 font-medium text-primary'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground',
                  )}
                >
                  {value.colorHex ? (
                    <span
                      className="h-3 w-3 rounded-full border border-border bg-[var(--swatch)]"
                      style={{ ['--swatch' as string]: value.colorHex }}
                    />
                  ) : null}
                  {value.nameAr}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {hasVariants && !activeVariant ? (
        <p className="text-xs text-destructive">{t('products.variantUnavailable')}</p>
      ) : null}

      <AddToCartButton
        productId={product.id}
        stockStatus={hasVariants && !activeVariant ? 'out_of_stock' : stockStatus}
        variantId={activeVariant?.id}
        variant="button"
        className="mt-2 h-12 w-full sm:w-auto sm:min-w-48"
      />
    </div>
  );
}
