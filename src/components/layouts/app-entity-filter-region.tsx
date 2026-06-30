'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useEntityFilterSlotRegion } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActionsState } from '@/components/layouts/page-header-actions-context';
import { cn } from '@/shared/utils';

const EXCLUDED_FILTER_PREFIXES = ['/hr/dashboard'] as const;

export function AppEntityFilterRegion({ className }: { className?: string }) {
  const pathname = usePathname();
  const { renderFnRef, reRenderSlotRef } = useEntityFilterSlotRegion();
  const { filterPanelOpen } = usePageHeaderActionsState();
  const excluded = EXCLUDED_FILTER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const [, forceUpdate] = React.useReducer((n: number) => n + 1, 0);

  React.useLayoutEffect(() => {
    reRenderSlotRef.current = forceUpdate;
    return () => { reRenderSlotRef.current = null; };
  }, [reRenderSlotRef]);

  React.useLayoutEffect(() => {
    forceUpdate();
  }, [pathname]);

  React.useEffect(() => {
    if (excluded) renderFnRef.current = null;
  }, [excluded, renderFnRef]);

  const hasSlotContent = !excluded && renderFnRef.current !== null;
  const content = hasSlotContent ? (renderFnRef.current?.() ?? null) : null;

  if (excluded || !content || !filterPanelOpen) return null;
  return (
    <div className={cn('relative mb-5 animate-fade-in', className)}>
      {content}
    </div>
  );
}
