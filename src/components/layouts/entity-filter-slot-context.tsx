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

/**
 * Renders the filter toolbar into the app layout slot above the page body.
 */
export function useEntityFilterSlot(render: () => React.ReactNode, deps: React.DependencyList): void {
  const { renderFnRef, reRenderSlotRef } = useEntityFilterSlotRegion();
  const settersRef = usePageHeaderActionsSettersRef();

  const renderRef = React.useRef(render);
  renderRef.current = render;

  const depsKey = serializeFilterSlotDeps(deps);

  const publishFilterSlot = React.useCallback(() => {
    settersRef.current.setFilterPanelOpen(true);
    reRenderSlotRef.current?.();
  }, [reRenderSlotRef, settersRef]);

  React.useLayoutEffect(() => {
    renderFnRef.current = () => renderRef.current();
    publishFilterSlot();

    return () => {
      renderFnRef.current = null;
      reRenderSlotRef.current?.();
      settersRef.current.setFilterPanelOpen(false);
    };
  }, [depsKey, publishFilterSlot, renderFnRef, reRenderSlotRef, settersRef]);
}
