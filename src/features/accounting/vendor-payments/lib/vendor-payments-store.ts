import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VendorPayment } from '@/features/accounting/domain/types/vendor-payment';
import { INITIAL_MOCK_VENDOR_PAYMENTS } from './mock-vendor-payments';

interface VendorPaymentsState {
  payments: VendorPayment[];
  getPayment: (id: string) => VendorPayment | undefined;
  savePayment: (payment: VendorPayment) => void;
  deletePayment: (id: string) => void;
  postPayment: (id: string) => void;
}

export const useVendorPaymentsStore = create<VendorPaymentsState>()(
  persist(
    (set, get) => ({
      payments: INITIAL_MOCK_VENDOR_PAYMENTS,

      getPayment: (id: string) => {
        return get().payments.find((p) => p.id === id);
      },

      savePayment: (payment: VendorPayment) => {
        set((state) => {
          const index = state.payments.findIndex((p) => p.id === payment.id);
          if (index >= 0) {
            const updated = [...state.payments];
            updated[index] = payment;
            return { payments: updated };
          }
          return { payments: [payment, ...state.payments] };
        });
      },

      deletePayment: (id: string) => {
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
        }));
      },

      postPayment: (id: string) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  state: 'posted',
                  name: p.name.startsWith('مسودة') ? `PAY/2024/${String(state.payments.length + 1).padStart(5, '0')}` : p.name,
                }
              : p,
          ),
        }));
      },
    }),
    {
      name: 'accounting-vendor-payments-storage',
    },
  ),
);
