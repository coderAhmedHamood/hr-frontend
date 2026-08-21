'use client';

import * as React from 'react';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';

/**
 * True once the persisted customer session has actually been read back from
 * localStorage.
 *
 * `useEffect(() => setReady(true), [])` is NOT equivalent: that fires when the
 * component mounts, which happens *before* zustand finishes rehydrating. A
 * guard reading `customer` at that moment sees `null` for a signed-in shopper
 * and bounces them to the login page — which then rehydrates, recognises the
 * session, and forwards them to wherever `returnTo` points. The visible result
 * is a logged-in customer being thrown at the sign-in screen and landing on
 * their profile instead of the page they asked for.
 *
 * Every storefront auth guard must wait on this before deciding to redirect.
 */
export function useStorefrontAuthReady(): boolean {
  // Starts false on both server and client so the first render matches and
  // React hydration stays clean; the effect below flips it immediately after.
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const finish = () => setReady(true);
    const unsubscribe = useStorefrontCustomerUi.persist.onFinishHydration(finish);
    // Rehydration can land between the initial state and this effect.
    if (useStorefrontCustomerUi.persist.hasHydrated()) finish();
    return unsubscribe;
  }, []);

  return ready;
}
