'use client';

import * as React from 'react';

type PageHeaderActionsCtxValue = {
  slot: React.ReactNode | null;
  setSlot: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  filterPanelOpen: boolean;
  setFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const PageHeaderActionsCtx = React.createContext<PageHeaderActionsCtxValue | null>(null);

export function PageHeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = React.useState<React.ReactNode | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
  const value = React.useMemo(
    () => ({ slot, setSlot, filterPanelOpen, setFilterPanelOpen }),
    [slot, filterPanelOpen],
  );
  return (
    <PageHeaderActionsCtx.Provider value={value}>
      {children}
    </PageHeaderActionsCtx.Provider>
  );
}

export function usePageHeaderActionsRegion() {
  const ctx = React.useContext(PageHeaderActionsCtx);
  if (!ctx) throw new Error('usePageHeaderActionsRegion must be used within PageHeaderActionsProvider');
  return ctx;
}

/**
 * Inject action buttons into topbar Row 2 from any page component.
 *
 * Intentionally uses two separate effects:
 * 1. Updates the slot whenever `deps` change (keeps button UI in sync).
 * 2. Cleans up slot + filter state only on unmount (navigation away).
 *
 * This avoids the bug where cleanup running on every dep-change would reset
 * `filterPanelOpen` back to false immediately after it was set to true.
 */
export function usePageHeaderActions(render: () => React.ReactNode, deps: React.DependencyList): void {
  const { setSlot, setFilterPanelOpen } = usePageHeaderActionsRegion();
  const renderRef = React.useRef(render);
  renderRef.current = render;

  const setSlotRef = React.useRef(setSlot);
  setSlotRef.current = setSlot;
  const setFilterPanelOpenRef = React.useRef(setFilterPanelOpen);
  setFilterPanelOpenRef.current = setFilterPanelOpen;

  // Update slot whenever deps change (setSlot kept in ref to avoid infinite loop)
  React.useEffect(() => {
    setSlotRef.current(renderRef.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Clean up only on unmount (page navigation)
  React.useEffect(() => {
    return () => {
      setSlotRef.current(null);
      setFilterPanelOpenRef.current(false);
    };
  }, []);
}
