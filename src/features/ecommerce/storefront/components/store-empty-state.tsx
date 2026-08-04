import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';

export function StoreEmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/15 px-6 py-16 text-center',
        className,
      )}
      role="status"
    >
      {Icon ? <Icon className="mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden /> : null}
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
    </div>
  );
}
