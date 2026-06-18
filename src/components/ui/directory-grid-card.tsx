import * as React from 'react';
import { cn } from '@/shared/utils';

/** Grid wrapper for directory / settings entity lists (contacts, branches, job titles, departments). */
export function DirectoryGrid({
  variant = 'default',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'wide' }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        variant === 'default' && 'xl:grid-cols-4',
        variant === 'wide' && 'xl:grid-cols-5',
        className,
      )}
      {...props}
    />
  );
}

export function DirectoryResultCount({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

type DirectoryGridCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Row click / keyboard focus affordance */
  interactive?: boolean;
  /** Stronger hover (e.g. departments) */
  hoverLift?: boolean;
  /**
   * Muted background tint on hover. Defaults to on for interactive flat cards,
   * off when `hoverLift` is on (lift-only cards).
   */
  interactiveTint?: boolean;
};

/** Unified entity card shell for HR directory pages. */
export function DirectoryGridCard({
  interactive,
  hoverLift,
  interactiveTint,
  className,
  ...props
}: DirectoryGridCardProps) {
  const tint =
    interactiveTint ?? (Boolean(interactive) && !hoverLift);
  return (
    <div
      className={cn(
        'group relative flex flex-col space-y-3 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft',
        interactive && 'cursor-pointer',
        tint && 'hover:bg-muted/30',
        hoverLift && 'transition-all hover:-translate-y-0.5 hover:shadow-elevated',
        className,
      )}
      {...props}
    />
  );
}

/** Decorative glow used on rich directory cards (e.g. departments). */
export function DirectoryGridCardDecoration() {
  return (
    <div className="pointer-events-none absolute -end-8 -top-8 h-24 w-24 rounded-full bg-primary opacity-0 blur-2xl transition-opacity group-hover:opacity-10" />
  );
}

export function DirectoryGridCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-2', className)} {...props} />;
}

export function DirectoryGridCardTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('min-w-0 truncate font-semibold', className)} {...props} />;
}

/** Display title for richer cards (e.g. departments). */
export function DirectoryGridCardHeading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-display text-base font-bold leading-snug transition-colors group-hover:text-primary',
        className,
      )}
      {...props}
    />
  );
}

export function DirectoryGridCardEyebrow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-1 flex items-center gap-1 text-[11px] text-muted-foreground', className)} {...props} />;
}

/** Leading icon tile (e.g. department / entity type). */
export function DirectoryGridCardIconWrap({
  active = true,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { active?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
        active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/60',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DirectoryGridCardMeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1.5 text-xs', className)} {...props} />;
}

export function DirectoryGridCardMetaRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between gap-2', className)} {...props} />;
}

export function DirectoryGridCardMetaChips({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-center gap-3 pt-1 pb-2 text-xs text-muted-foreground', className)} {...props} />;
}

/** Stops propagation so row onClick does not fire when using action buttons. */
export function DirectoryGridCardFooter({
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-auto flex items-center justify-end gap-1 border-t border-border pt-3', className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    />
  );
}
