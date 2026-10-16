import * as React from 'react';

/**
 * A stable function that always runs the latest `fn`.
 * Needed for callbacks rendered through `usePageHeaderActions`, whose slot only
 * re-renders when its (serialized) deps change — so a plain `useCallback`
 * captured there can go stale when filters change.
 */
export function useLatestCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = React.useRef(fn);
  React.useLayoutEffect(() => {
    ref.current = fn;
  });
  return React.useCallback((...args: A) => ref.current(...args), []);
}
