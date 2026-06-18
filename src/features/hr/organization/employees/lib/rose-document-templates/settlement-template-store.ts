import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_ROSE_SETTLEMENT_TEMPLATE,
  normalizeSettlementTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-settlement-template';
import type { RoseSettlementTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const STORAGE_KEY = 'rose-hr-settlement-template-v1';

type State = {
  template: RoseSettlementTemplateContent;
  updateTemplate: (patch: Partial<RoseSettlementTemplateContent>) => void;
  resetTemplate: () => void;
};

export const useRoseSettlementTemplateStore = create<State>()(
  persist(
    (set) => ({
      template: DEFAULT_ROSE_SETTLEMENT_TEMPLATE,
      updateTemplate: (patch) =>
        set((s) => ({
          template: normalizeSettlementTemplate({ ...s.template, ...patch } as Record<string, unknown>),
        })),
      resetTemplate: () => set({ template: DEFAULT_ROSE_SETTLEMENT_TEMPLATE }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ template: state.template }),
      migrate: (persisted) => {
        const p = persisted as { template?: Record<string, unknown> } | undefined;
        if (!p?.template) return { template: DEFAULT_ROSE_SETTLEMENT_TEMPLATE };
        return { template: normalizeSettlementTemplate(p.template) };
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<State> | undefined;
        if (!p?.template) return current;
        return { ...current, template: normalizeSettlementTemplate(p.template as Record<string, unknown>) };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        useRoseSettlementTemplateStore.setState({
          template: normalizeSettlementTemplate(state.template as Record<string, unknown>),
        });
      },
    },
  ),
);
