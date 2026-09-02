import { create } from 'zustand';
import type { FiscalPosition } from '@/features/accounting/domain/types/fiscal-position';
import { MOCK_FISCAL_POSITIONS } from '@/features/accounting/fiscal-positions/lib/mock-fiscal-positions';

type FiscalPositionsState = {
  positions: FiscalPosition[];
  getPosition: (id: string) => FiscalPosition | undefined;
  save: (position: FiscalPosition) => void;
  remove: (id: string) => void;
};

export const useFiscalPositionsStore = create<FiscalPositionsState>((set, get) => ({
  positions: MOCK_FISCAL_POSITIONS,

  getPosition: (id: string) => {
    return get().positions.find(
      (p) => p.id.toLowerCase() === id.toLowerCase() || p.name.toLowerCase() === id.toLowerCase(),
    );
  },

  save: (position: FiscalPosition) =>
    set((state) => {
      const exists = state.positions.some(
        (p) => p.id.toLowerCase() === position.id.toLowerCase() || p.name.toLowerCase() === position.name.toLowerCase(),
      );
      const updated = exists
        ? state.positions.map((p) =>
            p.id.toLowerCase() === position.id.toLowerCase() || p.name.toLowerCase() === position.name.toLowerCase()
              ? position
              : p,
          )
        : [...state.positions, position];

      return { positions: updated };
    }),

  remove: (id: string) =>
    set((state) => ({
      positions: state.positions.filter((p) => p.id !== id),
    })),
}));
