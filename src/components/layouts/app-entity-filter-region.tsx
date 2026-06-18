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

  // Register our forceUpdate before any useEffect in child components fire
  // (useLayoutEffect runs before useEffect across the whole commit).
  // Also wire setFilterPanelOpen so the first content registration opens the
  // filter bar in the same micro-task — no extra effect cycle needed.
  React.useLayoutEffect(() => {
    reRenderSlotRef.current = () => {
      // Only open when content is being registered, not when it's cleared.
      if (!excluded && renderFnRef.current !== null) setFilterPanelOpen(true);
      forceUpdate();
    };
    return () => { reRenderSlotRef.current = null; };
  }, [reRenderSlotRef, renderFnRef, excluded, setFilterPanelOpen]);

  // Clear slot when navigating to an excluded path.
  React.useEffect(() => {
    if (excluded) renderFnRef.current = null;
  }, [excluded, renderFnRef]);

  // Render the slot content fresh on every render (renderFnRef.current is always current).
  const content = excluded ? null : (renderFnRef.current?.() ?? null);

  if (excluded || !content || !filterPanelOpen) return null;
  return (
    <div className={cn('relative mb-5 animate-fade-in', className)}>
      {content}
    </div>
  );
}
