'use client';

import * as React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import {
  addPartnerWishlistItem,
  clearPartnerWishlist,
  fetchPartnerWishlist,
  removePartnerWishlistItem,
} from '@/features/ecommerce/shared/lib/api/store-wishlist-api';
import { isStoreHttpEnabled, StoreHttpError } from '@/features/ecommerce/storefront/lib/api/store-http';

interface StorefrontWishlistUiState {
  productIds: string[];
  /** Last partner token whose server wishlist was merged into `productIds`. */
  hydratedToken: string | null;
  setProductIds: (productIds: string[]) => void;
  /**
   * Toggle favorite. With partner token → `/public/store/wishlist`.
   * Guest (no token) → localStorage only (`storefront-wishlist`).
   */
  toggle: (productId: string, token?: string | null) => void;
  has: (productId: string) => boolean;
  remove: (productId: string, token?: string | null) => void;
  clear: (token?: string | null) => void;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export const useStorefrontWishlistUi = create<StorefrontWishlistUiState>()(
  persist(
    (set, get) => ({
      productIds: [],
      hydratedToken: null,
      setProductIds: (productIds) => set({ productIds: uniqueIds(productIds) }),
      toggle: (productId, token) => {
        const exists = get().productIds.includes(productId);
        const next = exists
          ? get().productIds.filter((id) => id !== productId)
          : [...get().productIds, productId];
        set({ productIds: next });

        if (!token || !isStoreHttpEnabled()) return;

        void (exists
          ? removePartnerWishlistItem(token, productId).then(() => undefined)
          : addPartnerWishlistItem(token, productId).then((items) => {
              set({ productIds: uniqueIds(items.map((item) => item.productId)) });
            })
        ).catch((error) => {
          if (exists && error instanceof StoreHttpError && error.status === 404) {
            return;
          }
          console.warn('[store] wishlist sync failed', error);
          set({
            productIds: exists
              ? uniqueIds([...get().productIds, productId])
              : get().productIds.filter((id) => id !== productId),
          });
        });
      },
      has: (productId) => get().productIds.includes(productId),
      remove: (productId, token) => {
        const previous = get().productIds;
        set({ productIds: previous.filter((id) => id !== productId) });
        if (!token || !isStoreHttpEnabled()) return;
        void removePartnerWishlistItem(token, productId).catch((error) => {
          if (error instanceof StoreHttpError && error.status === 404) return;
          console.warn('[store] wishlist remove failed', error);
          set({ productIds: previous });
        });
      },
      clear: (token) => {
        const previous = get().productIds;
        if (previous.length === 0) return;
        set({ productIds: [] });
        if (!token || !isStoreHttpEnabled()) return;
        void clearPartnerWishlist(token).catch((error) => {
          console.warn('[store] wishlist clear failed', error);
          set({ productIds: previous });
        });
      },
    }),
    {
      name: 'storefront-wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
);

/**
 * When a partner logs in: push guest local IDs via POST, then replace with GET.
 * On logout: keep local cache (no API) — guest browsing continues offline.
 */
export function useStorefrontWishlistSync() {
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);
  const hydratedToken = useStorefrontWishlistUi((s) => s.hydratedToken);
  const [persistReady, setPersistReady] = React.useState(() =>
    typeof window === 'undefined' ? false : useStorefrontWishlistUi.persist.hasHydrated(),
  );

  React.useEffect(() => {
    setPersistReady(useStorefrontWishlistUi.persist.hasHydrated());
    return useStorefrontWishlistUi.persist.onFinishHydration(() => {
      setPersistReady(true);
    });
  }, []);

  React.useEffect(() => {
    if (!persistReady || !isStoreHttpEnabled()) return;

    if (!accessToken) {
      if (hydratedToken) {
        useStorefrontWishlistUi.setState({ hydratedToken: null });
      }
      return;
    }

    if (hydratedToken === accessToken) return;

    let cancelled = false;

    void (async () => {
      try {
        const guestIds = useStorefrontWishlistUi.getState().productIds;
        const serverItems = await fetchPartnerWishlist(accessToken);
        if (cancelled) return;

        const serverIds = new Set(serverItems.map((item) => item.productId));
        const toAdd = guestIds.filter((id) => !serverIds.has(id));

        for (const productId of toAdd) {
          try {
            await addPartnerWishlistItem(accessToken, productId);
          } catch (error) {
            // 404 product missing — skip; other errors still log
            if (!(error instanceof StoreHttpError && error.status === 404)) {
              console.warn('[store] wishlist guest sync add failed', productId, error);
            }
          }
          if (cancelled) return;
        }

        const merged =
          toAdd.length > 0 ? await fetchPartnerWishlist(accessToken) : serverItems;
        if (cancelled) return;

        useStorefrontWishlistUi.setState({
          productIds: uniqueIds(merged.map((item) => item.productId)),
          hydratedToken: accessToken,
        });
      } catch (error) {
        console.warn('[store] wishlist hydrate failed', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hydratedToken, persistReady]);
}

/** @deprecated Prefer `useWishlistBadgeCount` — uses GET /public/store/badges when logged in. */
export function useWishlistCount(): number {
  return useStorefrontWishlistUi((state) => state.productIds.length);
}
