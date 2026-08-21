'use client';

import { useTranslations } from 'next-intl';
import type { PromoBadgeKind } from '@/features/ecommerce/storefront/lib/product-display';
import { cn } from '@/shared/utils';

const BADGE_STYLES: Record<PromoBadgeKind, string> = {
  'best-seller': 'bg-primary text-primary-foreground',
  deals: 'bg-secondary text-secondary-foreground',
  wholesale: 'bg-foreground text-background',
  new: 'bg-emerald-700 text-white',
  discount: 'bg-amber-700 text-white',
};

type ProductPromoBadgesProps = {
  badges: PromoBadgeKind[];
  /** Overlay stack on product image (card). */
  variant?: 'overlay' | 'inline';
  className?: string;
};

export function ProductPromoBadges({
  badges,
  variant = 'overlay',
  className,
}: ProductPromoBadgesProps) {
  const t = useTranslations('storefront');

  if (badges.length === 0) return null;

  const labelFor = (badge: PromoBadgeKind) => {
    if (badge === 'best-seller') return t('components.badgeBestSeller');
    if (badge === 'wholesale') return t('components.badgeWholesale');
    if (badge === 'new') return t('components.badgeNew');
    if (badge === 'discount') return t('components.badgeDiscount');
    return t('components.badgeDeals');
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {badges.map((badge) => (
          <span
            key={badge}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none',
              BADGE_STYLES[badge],
            )}
          >
            {labelFor(badge)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute start-0 top-0 z-10 flex max-w-[85%] flex-col gap-0.5',
        className,
      )}
    >
      {badges.map((badge) => (
        <span
          key={badge}
          className={cn(
            'truncate rounded-none px-2.5 py-1.5 text-[10px] font-bold leading-none tracking-wide shadow-soft first:rounded-ee-2xl',
            BADGE_STYLES[badge],
          )}
        >
          {labelFor(badge)}
        </span>
      ))}
    </div>
  );
}
