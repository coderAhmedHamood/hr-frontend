'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useEntityFilterSlotRegion } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActionsRegion } from '@/components/layouts/page-header-actions-context';
import { cn } from '@/shared/utils';
import { HR_PERMISSIONS_BASE } from '@/features/hr/permissions/constants/routes';

const EXCLUDED_FILTER_PREFIXES = ['/hr/dashboard', HR_PERMISSIONS_BASE] as const;

export function AppEntityFilterRegion({ className }: { className?: string }) {
  const pathname = usePathname();
  const { renderFnRef, reRenderSlotRef } = useEntityFilterSlotRegion();
  const { filterPanelOpen, setFilterPanelOpen } = usePageHeaderActionsRegion();
  const excluded = EXCLUDED_FILTER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // forceUpdate lets useEntityFilterSlot trigger our re-render without any
  // context state change — the caller component never sees this re-render.
  const [, forceUpdate] = React.useReducer((n: number) => n + 1, 0);

  // Register forceUpdate only — do not call setFilterPanelOpen here. Opening the
  // panel from this callback re-renders the whole provider tree (including pages
  // with useEntityFilterSlot), which can retrigger slot effects and overflow depth.
  React.useLayoutEffect(() => {
    reRenderSlotRef.current = forceUpdate;
    return () => { reRenderSlotRef.current = null; };
  }, [reRenderSlotRef, forceUpdate]);

  const hasSlotContent = !excluded && renderFnRef.current !== null;

  // Open the filter bar once when a page registers slot content (idempotent).
  React.useEffect(() => {
    if (!hasSlotContent) return;
    setFilterPanelOpen((prev) => prev || true);
  }, [hasSlotContent, setFilterPanelOpen]);

  // Clear slot when navigating to an excluded path.
  React.useEffect(() => {
    if (excluded) renderFnRef.current = null;
  }, [excluded, renderFnRef]);

  // Render the slot content fresh on every render (renderFnRef.current is always current).
  const content = hasSlotContent ? (renderFnRef.current?.() ?? null) : null;

  if (excluded || !content || !filterPanelOpen) return null;
  return (
    <div className={cn('relative mb-5 animate-fade-in', className)}>
      {content}
    </div>
  );
}
