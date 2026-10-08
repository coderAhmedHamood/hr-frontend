'use client';

import * as React from 'react';
import { usePageHeaderActionsSettersRef } from '@/components/layouts/page-header-actions-context';

type EntityFilterSlotContextValue = {
  /** Holds the current render function registered by useEntityFilterSlot. */
  renderFnRef: React.MutableRefObject<(() => React.ReactNode) | null>;
  /**
   * Holds AppEntityFilterRegion's forceUpdate callback.
   * useEntityFilterSlot calls this to tell the region to re-render without
   * touching any context state — so the caller component never re-renders
   * from the slot system and the infinite-loop cascade is impossible.
   */
  reRenderSlotRef: React.MutableRefObject<(() => void) | null>;
};

const EntityFilterSlotContext = React.createContext<EntityFilterSlotContextValue | null>(null);

export function EntityFilterSlotProvider({ children }: { children: React.ReactNode }) {
  const renderFnRef = React.useRef<(() => React.ReactNode) | null>(null);
  const reRenderSlotRef = React.useRef<(() => void) | null>(null);
  const value = React.useRef<EntityFilterSlotContextValue>({ renderFnRef, reRenderSlotRef }).current;
  return (
    <EntityFilterSlotContext.Provider value={value}>
      {children}
    </EntityFilterSlotContext.Provider>
  );
}

export function useEntityFilterSlotRegion(): EntityFilterSlotContextValue {
  const ctx = React.useContext(EntityFilterSlotContext);
  if (!ctx) {
    throw new Error('useEntityFilterSlotRegion must be used within EntityFilterSlotProvider');
  }
  return ctx;
}

function serializeFilterSlotDeps(deps: React.DependencyList): string {
  try {
    return JSON.stringify(deps, (_key, value) => {
      if (typeof value === 'function') return undefined;
      if (React.isValidElement(value)) return undefined;
      return value;
    });
  } catch {
    return String(deps.length);
  }
}

/** Phones (below `md`): filters start folded behind the filter button. */
function isPhoneViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767.98px)').matches;
}

/**
 * Renders the filter toolbar into the app layout slot above the page body.
 *
 * The panel opens when the page mounts on wide screens and starts folded on
 * phones (it took a third of the screen above the list). Afterwards only the
 * filter button opens or folds it: a filter change re-renders the panel
 * without reopening it.
 */
export function useEntityFilterSlot(render: () => React.ReactNode, deps: React.DependencyList): void {
  const { renderFnRef, reRenderSlotRef } = useEntityFilterSlotRegion();
  const settersRef = usePageHeaderActionsSettersRef();

  const renderRef = React.useRef(render);
  renderRef.current = render;

  const depsKey = serializeFilterSlotDeps(deps);

  React.useLayoutEffect(() => {
    renderFnRef.current = () => renderRef.current();
    settersRef.current.setFilterPanelOpen(!isPhoneViewport());
    reRenderSlotRef.current?.();

    return () => {
      renderFnRef.current = null;
      reRenderSlotRef.current?.();
      settersRef.current.setFilterPanelOpen(false);
    };
  }, [renderFnRef, reRenderSlotRef, settersRef]);

  React.useLayoutEffect(() => {
    reRenderSlotRef.current?.();
  }, [depsKey, reRenderSlotRef]);
}
