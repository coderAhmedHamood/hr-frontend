import { cn } from '@/shared/utils';

type ProductPriceProps = {
  price: string;
  compareAtPrice?: string;
  discountPercent?: number | null;
  layout?: 'stacked' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: {
    price: 'text-[11px] font-bold leading-none sm:text-xs',
    compare: 'text-[9px] leading-none sm:text-[10px]',
    discount: 'text-[9px] font-bold leading-none sm:text-[10px]',
  },
  md: {
    price: 'text-sm font-bold leading-none sm:text-base',
    compare: 'text-[11px] leading-none sm:text-xs',
    discount: 'text-[11px] font-bold leading-none sm:text-xs',
  },
  lg: {
    price: 'text-xl font-bold leading-none sm:text-2xl',
    compare: 'text-sm leading-none',
    discount: 'text-sm font-bold leading-none',
  },
} as const;

export function ProductPrice({
  price,
  compareAtPrice,
  discountPercent,
  layout = 'inline',
  size = 'sm',
  muted = false,
  className,
}: ProductPriceProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        layout === 'stacked' && 'flex flex-col gap-0.5',
        // Keep price + compare + discount on one row; shrink fonts instead of wrapping/truncating
        layout === 'inline' && 'flex flex-nowrap items-baseline gap-x-1',
        muted && 'opacity-60',
        className,
      )}
    >
      <span className={cn(sizes.price, 'shrink-0 whitespace-nowrap text-foreground')}>{price}</span>
      {compareAtPrice ? (
        <span className={cn(sizes.compare, 'shrink-0 whitespace-nowrap text-muted-foreground line-through')}>
          {compareAtPrice}
        </span>
      ) : null}
      {discountPercent && discountPercent > 0 ? (
        <span className={cn(sizes.discount, 'shrink-0 whitespace-nowrap text-secondary')}>
          {discountPercent}%
        </span>
      ) : null}
    </div>
  );
}
