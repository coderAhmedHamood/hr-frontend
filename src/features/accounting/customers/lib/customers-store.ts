import { create } from 'zustand';
import type { Customer } from '@/features/accounting/domain/types/customer';
import { MOCK_CUSTOMERS } from '@/features/accounting/customers/lib/mock-customers';

type CustomersState = {
  customers: Customer[];
  getCustomer: (id: string) => Customer | undefined;
  saveCustomer: (customer: Customer) => void;
  removeCustomer: (id: string) => void;
};

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: MOCK_CUSTOMERS,

  getCustomer: (id: string) => {
    return get().customers.find((c) => c.id === id || c.name === id);
  },

  saveCustomer: (customer: Customer) =>
    set((state) => {
      const exists = state.customers.some((c) => c.id === customer.id);
      const updated = exists
        ? state.customers.map((c) => (c.id === customer.id ? customer : c))
        : [customer, ...state.customers];

      return { customers: updated };
    }),

  removeCustomer: (id: string) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    })),
}));
