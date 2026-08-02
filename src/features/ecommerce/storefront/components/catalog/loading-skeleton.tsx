import { cn } from '@/shared/utils';
import { resolveProductGridClass } from '@/features/ecommerce/storefront/components/catalog/product-grid';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden />;
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-card', className)}>
      <SkeletonBlock className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <SkeletonBlock className="h-3 w-1/3" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-4/5" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <SkeletonBlock className="h-5 w-20" />
          <SkeletonBlock className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

type ProductGridSkeletonProps = {
  count?: number;
  columns?: { mobile?: number; tablet?: number; desktop?: number };
  className?: string;
};

export function ProductGridSkeleton({ count = 10, columns, className }: ProductGridSkeletonProps) {
  return (
    <div
      className={cn('grid gap-4', resolveProductGridClass(columns), className)}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function HeroCarouselSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)} aria-busy="true" aria-label="Loading hero">
      <SkeletonBlock className="aspect-[21/7] min-h-[160px] w-full rounded-xl sm:min-h-[220px]" />
      <div className="flex justify-center gap-2">
        <SkeletonBlock className="h-2 w-6 rounded-full" />
        <SkeletonBlock className="h-2 w-2 rounded-full" />
        <SkeletonBlock className="h-2 w-2 rounded-full" />
      </div>
    </div>
  );
}

export function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4', className)} aria-busy="true">
      <SkeletonBlock className="h-7 w-48" />
      <SkeletonBlock className="h-4 w-72 max-w-full" />
      <ProductGridSkeleton count={5} />
    </div>
  );
}
