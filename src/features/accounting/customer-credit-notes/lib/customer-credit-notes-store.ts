import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerCreditNote } from '@/features/accounting/domain/types/customer-credit-note';
import { INITIAL_MOCK_CREDIT_NOTES } from './mock-customer-credit-notes';

interface CustomerCreditNotesState {
  creditNotes: CustomerCreditNote[];
  getCreditNote: (id: string) => CustomerCreditNote | undefined;
  saveCreditNote: (creditNote: CustomerCreditNote) => void;
  deleteCreditNote: (id: string) => void;
  postCreditNote: (id: string) => void;
  registerRefundPayment: (id: string, amount: number) => void;
}

export const useCustomerCreditNotesStore = create<CustomerCreditNotesState>()(
  persist(
    (set, get) => ({
      creditNotes: INITIAL_MOCK_CREDIT_NOTES,

      getCreditNote: (id: string) => {
        return get().creditNotes.find((cn) => cn.id === id);
      },

      saveCreditNote: (creditNote: CustomerCreditNote) => {
        set((state) => {
          const index = state.creditNotes.findIndex((cn) => cn.id === creditNote.id);
          if (index >= 0) {
            const updated = [...state.creditNotes];
            updated[index] = creditNote;
            return { creditNotes: updated };
          }
          return { creditNotes: [creditNote, ...state.creditNotes] };
        });
      },

      deleteCreditNote: (id: string) => {
        set((state) => ({
          creditNotes: state.creditNotes.filter((cn) => cn.id !== id),
        }));
      },

      postCreditNote: (id: string) => {
        set((state) => ({
          creditNotes: state.creditNotes.map((cn) =>
            cn.id === id
              ? {
                  ...cn,
                  state: 'posted',
                  name: cn.name.startsWith('مسودة') ? `RINV/2024/${String(state.creditNotes.length + 1).padStart(5, '0')}` : cn.name,
                }
              : cn,
          ),
        }));
      },

      registerRefundPayment: (id: string, amount: number) => {
        set((state) => ({
          creditNotes: state.creditNotes.map((cn) => {
            if (cn.id !== id) return cn;
            const newDue = Math.max(0, cn.amountDue - amount);
            return {
              ...cn,
              amountDue: newDue,
              paymentState: newDue === 0 ? 'paid' : 'partial',
            };
          }),
        }));
      },
    }),
    {
      name: 'accounting-customer-credit-notes-storage',
    },
  ),
);
