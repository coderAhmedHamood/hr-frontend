'use client';

import * as React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePageHeaderActionsRegion } from '@/components/layouts/page-header-actions-context';
import { cn } from '@/shared/utils';

export function FilterToggleButton({ activeFilterCount = 0 }: { activeFilterCount?: number }) {
  const { filterPanelOpen, setFilterPanelOpen } = usePageHeaderActionsRegion();
  return (
    <button
      type="button"
      onClick={() => setFilterPanelOpen((v) => !v)}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
        filterPanelOpen
          ? 'border-primary/50 bg-primary/8 text-primary'
          : 'border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
      فلترة
      {activeFilterCount > 0 && (
        <Badge variant="secondary" className="ms-0.5 h-4 min-w-4 rounded-full px-1 py-0 text-[10px] leading-none">
          {activeFilterCount}
        </Badge>
      )}
    </button>
  );
}
