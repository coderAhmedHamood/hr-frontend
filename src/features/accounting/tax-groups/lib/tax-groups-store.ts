import { create } from 'zustand';
import type { TaxGroup } from '@/features/accounting/domain/types/tax-group';
import { MOCK_TAX_GROUPS } from '@/features/accounting/tax-groups/lib/mock-tax-groups';

type TaxGroupsState = {
  taxGroups: TaxGroup[];
  getTaxGroup: (id: string) => TaxGroup | undefined;
  save: (taxGroup: TaxGroup) => void;
  remove: (id: string) => void;
};

export const useTaxGroupsStore = create<TaxGroupsState>((set, get) => ({
  taxGroups: MOCK_TAX_GROUPS,

  getTaxGroup: (id: string) => {
    return get().taxGroups.find(
      (tg) =>
        tg.id.toLowerCase() === id.toLowerCase() ||
        encodeURIComponent(tg.id).toLowerCase() === id.toLowerCase() ||
        tg.name.toLowerCase() === id.toLowerCase() ||
        encodeURIComponent(tg.name).toLowerCase() === id.toLowerCase(),
    );
  },

  save: (taxGroup: TaxGroup) =>
    set((state) => {
      const exists = state.taxGroups.some(
        (tg) =>
          tg.id.toLowerCase() === taxGroup.id.toLowerCase() ||
          tg.name.toLowerCase() === taxGroup.name.toLowerCase(),
      );
      const updated = exists
        ? state.taxGroups.map((tg) =>
            tg.id.toLowerCase() === taxGroup.id.toLowerCase() ||
            tg.name.toLowerCase() === taxGroup.name.toLowerCase()
              ? taxGroup
              : tg,
          )
        : [...state.taxGroups, taxGroup];

      return { taxGroups: updated };
    }),

  remove: (id: string) =>
    set((state) => ({
      taxGroups: state.taxGroups.filter((tg) => tg.id !== id),
    })),
}));
