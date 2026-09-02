import { create } from 'zustand';
import type { Currency, CurrencyRate } from '@/features/accounting/domain/types/currency';
import { MOCK_CURRENCIES } from '@/features/accounting/currencies/lib/mock-currencies';

type CurrenciesState = {
  currencies: Currency[];
  baseCurrencyCode: string;
  getCurrency: (idOrCode: string) => Currency | undefined;
  toggleActive: (id: string) => void;
  save: (currency: Currency) => void;
  remove: (id: string) => void;
  addRate: (currencyId: string, rate: Omit<CurrencyRate, 'id'>) => void;
  removeRate: (currencyId: string, rateId: string) => void;
  updateRate: (currencyId: string, rate: CurrencyRate) => void;
};

export const useCurrenciesStore = create<CurrenciesState>((set, get) => ({
  currencies: MOCK_CURRENCIES,
  baseCurrencyCode: 'YER',

  getCurrency: (idOrCode: string) => {
    const currs = get().currencies;
    return currs.find(
      (c) => c.id.toLowerCase() === idOrCode.toLowerCase() || c.code.toLowerCase() === idOrCode.toLowerCase(),
    );
  },

  toggleActive: (id: string) =>
    set((state) => ({
      currencies: state.currencies.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
    })),

  save: (currency: Currency) =>
    set((state) => {
      const exists = state.currencies.some(
        (c) => c.id.toLowerCase() === currency.id.toLowerCase() || c.code.toLowerCase() === currency.code.toLowerCase(),
      );
      const updatedCurrencies = exists
        ? state.currencies.map((c) =>
            c.id.toLowerCase() === currency.id.toLowerCase() || c.code.toLowerCase() === currency.code.toLowerCase()
              ? currency
              : c,
          )
        : [currency, ...state.currencies];

      return { currencies: updatedCurrencies };
    }),

  remove: (id: string) =>
    set((state) => ({
      currencies: state.currencies.filter((c) => c.id !== id),
    })),

  addRate: (currencyId: string, rateData: Omit<CurrencyRate, 'id'>) =>
    set((state) => {
      const rate: CurrencyRate = {
        ...rateData,
        id: `rate-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      return {
        currencies: state.currencies.map((c) => {
          if (c.id === currencyId || c.code === currencyId) {
            const updatedRates = [rate, ...c.rates];
            return {
              ...c,
              rates: updatedRates,
              unitPerBaseRate: rate.unitPerBase,
              lastUpdated: rate.date,
            };
          }
          return c;
        }),
      };
    }),

  removeRate: (currencyId: string, rateId: string) =>
    set((state) => ({
      currencies: state.currencies.map((c) => {
        if (c.id === currencyId || c.code === currencyId) {
          const updatedRates = c.rates.filter((r) => r.id !== rateId);
          return {
            ...c,
            rates: updatedRates,
            unitPerBaseRate: updatedRates.length > 0 ? updatedRates[0].unitPerBase : c.unitPerBaseRate,
            lastUpdated: updatedRates.length > 0 ? updatedRates[0].date : '',
          };
        }
        return c;
      }),
    })),

  updateRate: (currencyId: string, updatedRate: CurrencyRate) =>
    set((state) => ({
      currencies: state.currencies.map((c) => {
        if (c.id === currencyId || c.code === currencyId) {
          const updatedRates = c.rates.map((r) => (r.id === updatedRate.id ? updatedRate : r));
          return {
            ...c,
            rates: updatedRates,
            unitPerBaseRate: updatedRates[0]?.unitPerBase ?? c.unitPerBaseRate,
          };
        }
        return c;
      }),
    })),
}));
