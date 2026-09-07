import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VendorBill } from '@/features/accounting/domain/types/vendor-bill';
import { INITIAL_MOCK_VENDOR_BILLS } from './mock-vendor-bills';

interface VendorBillsState {
  bills: VendorBill[];
  getBill: (id: string) => VendorBill | undefined;
  saveBill: (bill: VendorBill) => void;
  deleteBill: (id: string) => void;
  postBill: (id: string) => void;
  registerBillPayment: (id: string, amount: number) => void;
}

export const useVendorBillsStore = create<VendorBillsState>()(
  persist(
    (set, get) => ({
      bills: INITIAL_MOCK_VENDOR_BILLS,

      getBill: (id: string) => {
        return get().bills.find((b) => b.id === id);
      },

      saveBill: (bill: VendorBill) => {
        set((state) => {
          const index = state.bills.findIndex((b) => b.id === bill.id);
          if (index >= 0) {
            const updated = [...state.bills];
            updated[index] = bill;
            return { bills: updated };
          }
          return { bills: [bill, ...state.bills] };
        });
      },

      deleteBill: (id: string) => {
        set((state) => ({
          bills: state.bills.filter((b) => b.id !== id),
        }));
      },

      postBill: (id: string) => {
        set((state) => ({
          bills: state.bills.map((b) =>
            b.id === id
              ? {
                  ...b,
                  state: 'posted',
                  name: b.name.startsWith('مسودة') ? `BILL/2024/${String(state.bills.length + 1).padStart(5, '0')}` : b.name,
                }
              : b,
          ),
        }));
      },

      registerBillPayment: (id: string, amount: number) => {
        set((state) => ({
          bills: state.bills.map((b) => {
            if (b.id !== id) return b;
            const newDue = Math.max(0, b.amountDue - amount);
            return {
              ...b,
              amountDue: newDue,
              paymentState: newDue === 0 ? 'paid' : 'partial',
            };
          }),
        }));
      },
    }),
    {
      name: 'accounting-vendor-bills-storage',
    },
  ),
);
