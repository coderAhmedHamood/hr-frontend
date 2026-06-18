'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

type DetailFieldProps = {
  label: string;
  value: ReactNode;
  dir?: 'ltr' | 'rtl';
  className?: string;
};

export function DetailField({ label, value, dir, className }: DetailFieldProps) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div
      className={cn(
        'flex flex-row-reverse items-start justify-between gap-3 border-t border-border pt-3 text-sm first:border-t-0 first:pt-0',
        className,
      )}
    >
      <span className="shrink-0 text-right text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-left font-medium" dir={dir}>
        {value}
      </span>
    </div>
  );
}
