import * as React from 'react';
import { cn } from '@/shared/utils';

export type EmptyStateCardProps = {
  /** Optional Lucide (or similar) icon */
  icon?: React.ElementType;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  /** `compact` for secondary empty/hint rows */
  size?: 'default' | 'compact';
};

/**
 * Dashed “empty” card used across HR lists when there is no data yet.
 * Keeps one visual language with data tables wrapped in `rounded-xl border bg-card`.
 */
export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  size = 'default',
}: EmptyStateCardProps) {
  const isCompact = size === 'compact';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-center',
        isCompact ? 'gap-2 py-10 px-4' : 'gap-1 py-14 px-5',
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            'shrink-0 text-muted-foreground/30',
            isCompact ? 'mb-0.5 h-8 w-8' : 'mb-2 h-10 w-10',
          )}
          aria-hidden
        />
      ) : null}
      <p className={cn('text-muted-foreground', isCompact ? 'text-sm' : 'text-sm font-medium')}>{title}</p>
      {description ? (
        <p className={cn('text-muted-foreground/60', isCompact ? 'text-xs' : 'mt-1 text-xs')}>{description}</p>
      ) : null}
      {children ? <div className={cn('flex flex-wrap items-center justify-center gap-2', isCompact ? 'mt-2' : 'mt-4')}>{children}</div> : null}
    </div>
  );
}
