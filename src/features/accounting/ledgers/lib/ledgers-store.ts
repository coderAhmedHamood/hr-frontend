import { create } from 'zustand';
import type { LedgerGroup } from '@/features/accounting/domain/types/ledger-group';
import { MOCK_LEDGER_GROUPS } from '@/features/accounting/ledgers/lib/mock-ledgers';

type LedgersState = {
  ledgerGroups: LedgerGroup[];
  addLedgerGroup: (group: Omit<LedgerGroup, 'id'>) => LedgerGroup;
  updateLedgerGroup: (id: string, group: Partial<LedgerGroup>) => void;
  removeLedgerGroup: (id: string) => void;
};

export const useLedgersStore = create<LedgersState>((set, get) => ({
  ledgerGroups: MOCK_LEDGER_GROUPS,

  addLedgerGroup: (groupData) => {
    const newGroup: LedgerGroup = {
      ...groupData,
      id: `lg-${Date.now()}`,
    };
    set((state) => ({
      ledgerGroups: [...state.ledgerGroups, newGroup],
    }));
    return newGroup;
  },

  updateLedgerGroup: (id, groupData) =>
    set((state) => ({
      ledgerGroups: state.ledgerGroups.map((g) => (g.id === id ? { ...g, ...groupData } : g)),
    })),

  removeLedgerGroup: (id) =>
    set((state) => ({
      ledgerGroups: state.ledgerGroups.filter((g) => g.id !== id),
    })),
}));
