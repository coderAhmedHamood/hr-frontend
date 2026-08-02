'use client';

import { Plus, ShoppingCart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { StockStatus } from '@/features/ecommerce/domain/constants/stock-status';
import { useStorefrontCartUi } from '@/features/ecommerce/storefront/hooks/use-storefront-cart-ui';
import { cn } from '@/shared/utils';

type AddToCartButtonProps = {
  productId: string;
  stockStatus: StockStatus;
  variant?: 'icon' | 'button' | 'quick';
  className?: string;
  onAdded?: () => void;
};

export function AddToCartButton({
  productId,
  stockStatus,
  variant = 'icon',
  className,
  onAdded,
}: AddToCartButtonProps) {
  const t = useTranslations('storefront');
  const addItem = useStorefrontCartUi((state) => state.addItem);
  const outOfStock = stockStatus === 'out_of_stock' || stockStatus === 'discontinued';

  function handleClick(event?: React.MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (outOfStock) return;
    addItem(productId);
    toast.success(t('products.addToCart'));
    onAdded?.();
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={outOfStock}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <ShoppingCart className="h-4 w-4" aria-hidden />
        {t('products.addToCart')}
      </button>
    );
  }

  if (variant === 'quick') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={outOfStock}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-soft transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        aria-label={t('products.addToCart')}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      aria-label={t('products.addToCart')}
    >
      <ShoppingCart className="h-4 w-4" aria-hidden />
    </button>
  );
}
