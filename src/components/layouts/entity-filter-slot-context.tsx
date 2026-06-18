'use client';

import * as React from 'react';

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

// The context value object is created once and never replaced — consumers never
// re-render because the context "changed".
const EntityFilterSlotContext = React.createContext<EntityFilterSlotContextValue | null>(null);

export function EntityFilterSlotProvider({ children }: { children: React.ReactNode }) {
  const renderFnRef = React.useRef<(() => React.ReactNode) | null>(null);
  const reRenderSlotRef = React.useRef<(() => void) | null>(null);
  // useRef.current is stable across renders — the context value itself never changes.
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

/**
 * Renders the filter toolbar into the app layout slot above the page body.
 *
 * The render function is stored in a ref (always current) and AppEntityFilterRegion
 * is told to re-render via a direct callback — no context state is mutated, so the
 * calling component never re-renders from the slot mechanism and infinite loops
 * caused by unstable dep references are impossible.
 */
export function useEntityFilterSlot(render: () => React.ReactNode, deps: React.DependencyList): void {
  const { renderFnRef, reRenderSlotRef } = useEntityFilterSlotRegion();

  const renderRef = React.useRef(render);
  renderRef.current = render;

  // Register/update the render fn and poke AppEntityFilterRegion to re-render.
  React.useEffect(() => {
    renderFnRef.current = () => renderRef.current();
    reRenderSlotRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps explicitly
  }, [renderFnRef, reRenderSlotRef, ...deps]);

  // Clear the slot only on true component unmount.
  React.useEffect(() => {
    return () => {
      renderFnRef.current = null;
      reRenderSlotRef.current?.();
    };
  }, [renderFnRef, reRenderSlotRef]);
}
