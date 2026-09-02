import { create } from 'zustand';
import type { Vendor } from '@/features/accounting/domain/types/vendor';
import { MOCK_VENDORS } from '@/features/accounting/vendors/lib/mock-vendors';

type VendorsState = {
  vendors: Vendor[];
  getVendor: (id: string) => Vendor | undefined;
  saveVendor: (vendor: Vendor) => void;
  removeVendor: (id: string) => void;
};

export const useVendorsStore = create<VendorsState>((set, get) => ({
  vendors: MOCK_VENDORS,

  getVendor: (id: string) => {
    return get().vendors.find((v) => v.id === id || v.name === id);
  },

  saveVendor: (vendor: Vendor) =>
    set((state) => {
      const exists = state.vendors.some((v) => v.id === vendor.id);
      const updated = exists
        ? state.vendors.map((v) => (v.id === vendor.id ? vendor : v))
        : [vendor, ...state.vendors];

      return { vendors: updated };
    }),

  removeVendor: (id: string) =>
    set((state) => ({
      vendors: state.vendors.filter((v) => v.id !== id),
    })),
}));
