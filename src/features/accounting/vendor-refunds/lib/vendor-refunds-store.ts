import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VendorRefund } from '@/features/accounting/domain/types/vendor-refund';
import { INITIAL_MOCK_VENDOR_REFUNDS } from './mock-vendor-refunds';

interface VendorRefundsState {
  refunds: VendorRefund[];
  getRefund: (id: string) => VendorRefund | undefined;
  saveRefund: (refund: VendorRefund) => void;
  deleteRefund: (id: string) => void;
  postRefund: (id: string) => void;
  registerRefundPayment: (id: string, amount: number) => void;
}

export const useVendorRefundsStore = create<VendorRefundsState>()(
  persist(
    (set, get) => ({
      refunds: INITIAL_MOCK_VENDOR_REFUNDS,

      getRefund: (id: string) => {
        return get().refunds.find((r) => r.id === id);
      },

      saveRefund: (refund: VendorRefund) => {
        set((state) => {
          const index = state.refunds.findIndex((r) => r.id === refund.id);
          if (index >= 0) {
            const updated = [...state.refunds];
            updated[index] = refund;
            return { refunds: updated };
          }
          return { refunds: [refund, ...state.refunds] };
        });
      },

      deleteRefund: (id: string) => {
        set((state) => ({
          refunds: state.refunds.filter((r) => r.id !== id),
        }));
      },

      postRefund: (id: string) => {
        set((state) => ({
          refunds: state.refunds.map((r) =>
            r.id === id
              ? {
                  ...r,
                  state: 'posted',
                  name: r.name.startsWith('مسودة') ? `RBILL/2024/${String(state.refunds.length + 1).padStart(5, '0')}` : r.name,
                }
              : r,
          ),
        }));
      },

      registerRefundPayment: (id: string, amount: number) => {
        set((state) => ({
          refunds: state.refunds.map((r) => {
            if (r.id !== id) return r;
            const newDue = Math.max(0, r.amountDue - amount);
            return {
              ...r,
              amountDue: newDue,
              paymentState: newDue === 0 ? 'paid' : 'partial',
            };
          }),
        }));
      },
    }),
    {
      name: 'accounting-vendor-refunds-storage',
    },
  ),
);
