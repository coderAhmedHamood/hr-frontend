'use client';

import { create } from 'zustand';

interface StorefrontWishlistUiState {
  productIds: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  remove: (productId: string) => void;
}

export const useStorefrontWishlistUi = create<StorefrontWishlistUiState>((set, get) => ({
  productIds: [],
  toggle: (productId) => {
    const exists = get().productIds.includes(productId);
    set({
      productIds: exists
        ? get().productIds.filter((id) => id !== productId)
        : [...get().productIds, productId],
    });
  },
  has: (productId) => get().productIds.includes(productId),
  remove: (productId) => set({ productIds: get().productIds.filter((id) => id !== productId) }),
}));

export function useWishlistCount(): number {
  return useStorefrontWishlistUi((state) => state.productIds.length);
}
