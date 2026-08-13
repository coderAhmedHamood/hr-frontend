'use client';

import * as React from 'react';

function serializeDeps(deps: React.DependencyList): string {
  try {
    return JSON.stringify(deps);
  } catch {
    return String(deps.length);
  }
}

/**
 * Pushes a panel's own action buttons (add-new, filter toggle) into a parent-owned
 * header-actions slot instead of rendering them inline — used by embedded settings
 * sub-panels (locations, delivery rates, payment accounts) so their buttons sit next
 * to the page's single global Save button.
 *
 * `render` is re-captured every render via a ref (so closures stay fresh), but the
 * parent is only notified when the serialized `deps` actually change — mirrors
 * `usePageHeaderActions`'s own deps-gated publish to avoid render loops.
 */
export function useHeaderExtrasBridge(
  onChange: ((node: React.ReactNode | null) => void) | undefined,
  render: () => React.ReactNode,
  deps: React.DependencyList,
): void {
  const renderRef = React.useRef(render);
  renderRef.current = render;

  const depsKey = serializeDeps(deps);

  React.useLayoutEffect(() => {
    if (!onChange) return;
    onChange(renderRef.current());
    return () => onChange(null);
  }, [depsKey, onChange]);
}
