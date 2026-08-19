'use client';

import * as React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils';

/**
 * Same look as `@/components/layouts/filter-toggle-button` (FilterToggleButton), but driven by
 * local open/onToggle state instead of the page-header context — for filter rows embedded inside
 * tabs/panels (e.g. settings sub-sections) where the global header filter slot isn't applicable.
 */
export function InlineFilterToggleButton({
  open,
  onToggle,
  activeFilterCount = 0,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  activeFilterCount?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className={cn(
        'flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
        open
          ? 'border-primary/50 bg-primary/8 text-primary'
          : 'border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
        className,
      )}
    >
      <SlidersHorizontal className="h-4 w-4 shrink-0" />
      <span>فلترة</span>
      {activeFilterCount > 0 ? (
        <Badge
          variant="secondary"
          className="ms-0.5 h-4 min-w-4 rounded-full px-1 py-0 text-[10px] leading-none"
        >
          {activeFilterCount}
        </Badge>
      ) : null}
    </button>
  );
}
