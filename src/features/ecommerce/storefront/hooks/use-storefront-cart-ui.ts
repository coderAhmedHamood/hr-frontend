'use client';

import { create } from 'zustand';

export type CartLine = {
  productId: string;
  /** Sellable variant when the product has attribute combinations. */
  variantId?: string;
  quantity: number;
};

function lineKey(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

interface StorefrontCartUiState {
  lines: CartLine[];
  addItem: (productId: string, quantity?: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clear: () => void;
}

export const useStorefrontCartUi = create<StorefrontCartUiState>((set, get) => ({
  lines: [],
  addItem: (productId, quantity = 1, variantId) => {
    const key = lineKey(productId, variantId);
    const existing = get().lines.find((line) => lineKey(line.productId, line.variantId) === key);
    if (existing) {
      set({
        lines: get().lines.map((line) =>
          lineKey(line.productId, line.variantId) === key
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        ),
      });
      return;
    }
    set({ lines: [...get().lines, { productId, variantId, quantity }] });
  },
  removeItem: (productId, variantId) =>
    set({
      lines: get().lines.filter((line) => lineKey(line.productId, line.variantId) !== lineKey(productId, variantId)),
    }),
  setQuantity: (productId, quantity, variantId) => {
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }
    set({
      lines: get().lines.map((line) =>
        lineKey(line.productId, line.variantId) === lineKey(productId, variantId)
          ? { ...line, quantity }
          : line,
      ),
    });
  },
  clear: () => set({ lines: [] }),
}));

export function useCartItemCount(): number {
  return useStorefrontCartUi((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));
}
