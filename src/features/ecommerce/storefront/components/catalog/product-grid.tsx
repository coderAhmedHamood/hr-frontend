import { cn } from '@/shared/utils';

type GridColumns = { mobile?: number; tablet?: number; desktop?: number };

const GRID_LAYOUT_CLASSES: Record<string, string> = {
  '1-1-1': 'grid-cols-1',
  '2-3-5': 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  '2-3-4': 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  '2-4-4': 'grid-cols-2 md:grid-cols-4 xl:grid-cols-4',
  '2-4-6': 'grid-cols-2 md:grid-cols-4 xl:grid-cols-6',
  '1-2-3': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  '1-2-4': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
};

export function resolveProductGridClass(columns?: GridColumns): string {
  const mobile = columns?.mobile ?? 2;
  const tablet = columns?.tablet ?? 3;
  const desktop = columns?.desktop ?? 5;
  return GRID_LAYOUT_CLASSES[`${mobile}-${tablet}-${desktop}`] ?? GRID_LAYOUT_CLASSES['2-3-5'];
}

type ProductGridProps = {
  children: React.ReactNode;
  columns?: GridColumns;
  className?: string;
};

export function ProductGrid({ children, columns, className }: ProductGridProps) {
  return <div className={cn('grid gap-4', resolveProductGridClass(columns), className)}>{children}</div>;
}

export function ProductGridItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('min-w-0', className)}>{children}</div>;
}

/** Standard product listing layout used across PLP, category, brand, and wishlist pages. */
export function ProductListingGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5', className)}>
      {children}
    </div>
  );
}
