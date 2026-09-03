import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccountingProduct } from '@/features/accounting/domain/types/accounting-product';
import { INITIAL_MOCK_PRODUCTS } from './mock-customer-products';

interface CustomerProductsState {
  products: AccountingProduct[];
  getProduct: (id: string) => AccountingProduct | undefined;
  saveProduct: (product: AccountingProduct) => void;
  deleteProduct: (id: string) => void;
}

export const useCustomerProductsStore = create<CustomerProductsState>()(
  persist(
    (set, get) => ({
      products: INITIAL_MOCK_PRODUCTS,

      getProduct: (id: string) => {
        return get().products.find((p) => p.id === id);
      },

      saveProduct: (product: AccountingProduct) => {
        set((state) => {
          const index = state.products.findIndex((p) => p.id === product.id);
          if (index >= 0) {
            const updated = [...state.products];
            updated[index] = product;
            return { products: updated };
          }
          return { products: [product, ...state.products] };
        });
      },

      deleteProduct: (id: string) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },
    }),
    {
      name: 'accounting-customer-products-storage',
    },
  ),
);
