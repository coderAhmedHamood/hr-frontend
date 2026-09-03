import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerPayment } from '@/features/accounting/domain/types/customer-payment';
import { INITIAL_MOCK_PAYMENTS } from './mock-customer-payments';

interface CustomerPaymentsState {
  payments: CustomerPayment[];
  getPayment: (id: string) => CustomerPayment | undefined;
  savePayment: (payment: CustomerPayment) => void;
  deletePayment: (id: string) => void;
  postPayment: (id: string) => void;
}

export const useCustomerPaymentsStore = create<CustomerPaymentsState>()(
  persist(
    (set, get) => ({
      payments: INITIAL_MOCK_PAYMENTS,

      getPayment: (id: string) => {
        return get().payments.find((p) => p.id === id);
      },

      savePayment: (payment: CustomerPayment) => {
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
                  name: p.name.startsWith('مسودة') ? `CUST.IN/2024/${String(state.payments.length + 1).padStart(5, '0')}` : p.name,
                }
              : p,
          ),
        }));
      },
    }),
    {
      name: 'accounting-customer-payments-storage',
    },
  ),
);
