'use client';

import * as React from 'react';

/**
 * Whether a CSS media query matches, kept up to date. False on the server
 * and before the first effect, so a layout chosen with it must also render
 * correctly the first time (it re-renders once the real value is known).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/** Phones: below Tailwind's `md` breakpoint (768px), where tables become cards. */
export function usePhoneLayout(): boolean {
  return useMediaQuery('(max-width: 767.98px)');
}
