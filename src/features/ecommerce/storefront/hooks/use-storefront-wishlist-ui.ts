'use client';

import * as React from 'react';
import { create } from 'zustand';
import { useStorefrontCustomerUi } from '@/features/ecommerce/storefront/hooks/use-storefront-customer-ui';
import {
  addPartnerWishlistItem,
  fetchPartnerWishlist,
  removePartnerWishlistItem,
} from '@/features/ecommerce/shared/lib/api/store-wishlist-api';
import { isStoreHttpEnabled } from '@/features/ecommerce/storefront/lib/api/store-http';

interface StorefrontWishlistUiState {
  productIds: string[];
  hydratedToken: string | null;
  setProductIds: (productIds: string[]) => void;
  /** Requires partner Bearer token — no guest local wishlist. */
  toggle: (productId: string, token: string) => void;
  has: (productId: string) => boolean;
  remove: (productId: string, token: string) => void;
}

export const useStorefrontWishlistUi = create<StorefrontWishlistUiState>((set, get) => ({
  productIds: [],
  hydratedToken: null,
  setProductIds: (productIds) => set({ productIds }),
  toggle: (productId, token) => {
    if (!token || !isStoreHttpEnabled()) return;
    const exists = get().productIds.includes(productId);
    const next = exists
      ? get().productIds.filter((id) => id !== productId)
      : [...get().productIds, productId];
    set({ productIds: next });

    void (exists
      ? removePartnerWishlistItem(token, productId)
      : addPartnerWishlistItem(token, productId)
    ).catch((error) => {
      console.warn('[store] wishlist sync failed', error);
      set({
        productIds: exists
          ? [...get().productIds, productId]
          : get().productIds.filter((id) => id !== productId),
      });
    });
  },
  has: (productId) => get().productIds.includes(productId),
  remove: (productId, token) => {
    if (!token || !isStoreHttpEnabled()) return;
    set({ productIds: get().productIds.filter((id) => id !== productId) });
    void removePartnerWishlistItem(token, productId).catch((error) => {
      console.warn('[store] wishlist remove failed', error);
    });
  },
}));

/** Hydrate wishlist from partner API when logged in. */
export function useStorefrontWishlistSync() {
  const accessToken = useStorefrontCustomerUi((s) => s.accessToken);
  const setProductIds = useStorefrontWishlistUi((s) => s.setProductIds);
  const hydratedToken = useStorefrontWishlistUi((s) => s.hydratedToken);

  React.useEffect(() => {
    if (!isStoreHttpEnabled()) return;
    if (!accessToken) {
      if (hydratedToken) {
        useStorefrontWishlistUi.setState({ productIds: [], hydratedToken: null });
      }
      return;
    }
    if (hydratedToken === accessToken) return;

    let cancelled = false;
    void fetchPartnerWishlist(accessToken)
      .then((items) => {
        if (cancelled) return;
        useStorefrontWishlistUi.setState({
          productIds: items.map((item) => item.productId),
          hydratedToken: accessToken,
        });
      })
      .catch((error) => {
        console.warn('[store] wishlist hydrate failed', error);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, hydratedToken, setProductIds]);
}

export function useWishlistCount(): number {
  return useStorefrontWishlistUi((state) => state.productIds.length);
}
