'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type StorefrontCustomerSession = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

interface StorefrontCustomerUiState {
  customer: StorefrontCustomerSession | null;
  login: (input: { name: string; phone: string; email: string }) => void;
  logout: () => void;
}

export const useStorefrontCustomerUi = create<StorefrontCustomerUiState>()(
  persist(
    (set) => ({
      customer: null,
      login: ({ name, phone, email }) =>
        set({
          customer: {
            id: crypto.randomUUID(),
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
          },
        }),
      logout: () => set({ customer: null }),
    }),
    {
      name: 'storefront-customer',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ customer: state.customer }),
    },
  ),
);
