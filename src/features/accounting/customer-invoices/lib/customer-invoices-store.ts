import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerInvoice } from '@/features/accounting/domain/types/customer-invoice';
import { INITIAL_MOCK_INVOICES } from './mock-customer-invoices';

interface CustomerInvoicesState {
  invoices: CustomerInvoice[];
  getInvoice: (id: string) => CustomerInvoice | undefined;
  saveInvoice: (invoice: CustomerInvoice) => void;
  deleteInvoice: (id: string) => void;
  postInvoice: (id: string) => void;
  registerPayment: (id: string, amount: number) => void;
}

export const useCustomerInvoicesStore = create<CustomerInvoicesState>()(
  persist(
    (set, get) => ({
      invoices: INITIAL_MOCK_INVOICES,

      getInvoice: (id: string) => {
        return get().invoices.find((i) => i.id === id);
      },

      saveInvoice: (invoice: CustomerInvoice) => {
        set((state) => {
          const index = state.invoices.findIndex((i) => i.id === invoice.id);
          if (index >= 0) {
            const updated = [...state.invoices];
            updated[index] = invoice;
            return { invoices: updated };
          }
          return { invoices: [invoice, ...state.invoices] };
        });
      },

      deleteInvoice: (id: string) => {
        set((state) => ({
          invoices: state.invoices.filter((i) => i.id !== id),
        }));
      },

      postInvoice: (id: string) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  state: 'posted',
                  name: inv.name.startsWith('مسودة') ? `INV/2024/${String(state.invoices.length + 1).padStart(5, '0')}` : inv.name,
                }
              : inv,
          ),
        }));
      },

      registerPayment: (id: string, amount: number) => {
        set((state) => ({
          invoices: state.invoices.map((inv) => {
            if (inv.id !== id) return inv;
            const newDue = Math.max(0, inv.amountDue - amount);
            return {
              ...inv,
              amountDue: newDue,
              paymentState: newDue === 0 ? 'paid' : 'partial',
            };
          }),
        }));
      },
    }),
    {
      name: 'accounting-customer-invoices-storage',
    },
  ),
);
