'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStorefrontWishlistUi } from '@/features/ecommerce/storefront/hooks/use-storefront-wishlist-ui';
import { cn } from '@/shared/utils';

type FavoriteButtonProps = {
  productId: string;
  variant?: 'overlay' | 'ghost' | 'outline';
  className?: string;
};

const variantClasses = {
  overlay:
    'inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-soft transition-colors',
  ghost: 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent',
  outline:
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent',
} as const;

export function FavoriteButton({ productId, variant = 'overlay', className }: FavoriteButtonProps) {
  const t = useTranslations('storefront');
  const toggleWishlist = useStorefrontWishlistUi((state) => state.toggle);
  const isWishlisted = useStorefrontWishlistUi((state) => state.has(productId));

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      className={cn(
        variantClasses[variant],
        isWishlisted ? 'text-destructive' : 'text-muted-foreground hover:text-destructive',
        className,
      )}
      aria-label={t('nav.wishlist')}
      aria-pressed={isWishlisted}
    >
      <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} aria-hidden />
    </button>
  );
}
