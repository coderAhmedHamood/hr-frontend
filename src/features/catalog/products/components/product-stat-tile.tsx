'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

type Props = {
  label: string;
  value: ReactNode;
  accent?: boolean;
  size?: 'md' | 'lg';
  className?: string;
};

/** Shared label-over-value tile — used by the product detail hero and the availability tab. */
export function ProductStatTile({ label, value, accent, size = 'md', className }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        accent ? 'border-primary/20 bg-primary/5' : 'border-border bg-muted/30',
        className,
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 font-semibold tabular-nums tracking-tight',
          size === 'lg' ? 'text-2xl' : 'text-xl',
          accent ? 'text-primary' : 'text-foreground',
        )}
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}
