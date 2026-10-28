import * as React from 'react';

const RESTORE_EVENT = 'hr-persisted-state-restored';

/**
 * Tells every persisted list state (filters, sort, grouping, columns) to
 * re-read its value from storage — after a saved view wrote its values back.
 */
export function notifyPersistedStateRestored(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(RESTORE_EVENT));
}

/** Runs `onRestore` whenever {@link notifyPersistedStateRestored} is called. */
export function usePersistedStateRestore(onRestore: () => void): void {
  const ref = React.useRef(onRestore);
  ref.current = onRestore;
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => ref.current();
    window.addEventListener(RESTORE_EVENT, handler);
    return () => window.removeEventListener(RESTORE_EVENT, handler);
  }, []);
}
