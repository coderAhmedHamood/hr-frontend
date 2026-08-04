import { useTranslations } from 'next-intl';
import { cn } from '@/shared/utils';

type DiscountBadgeProps = {
  percent: number;
  className?: string;
  size?: 'sm' | 'md';
};

export function DiscountBadge({ percent, className, size = 'sm' }: DiscountBadgeProps) {
  const t = useTranslations('storefront.components');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-secondary font-bold text-secondary-foreground',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      {t('discount', { percent })}
    </span>
  );
}
