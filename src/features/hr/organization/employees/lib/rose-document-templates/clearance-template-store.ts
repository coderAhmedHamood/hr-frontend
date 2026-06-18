import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_ROSE_CLEARANCE_TEMPLATE,
  normalizeClearanceTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-clearance-template';
import type { RoseClearanceTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const STORAGE_KEY = 'rose-hr-clearance-template-v1';

type State = {
  template: RoseClearanceTemplateContent;
  updateTemplate: (patch: Partial<RoseClearanceTemplateContent>) => void;
  resetTemplate: () => void;
};

export const useRoseClearanceTemplateStore = create<State>()(
  persist(
    (set) => ({
      template: DEFAULT_ROSE_CLEARANCE_TEMPLATE,
      updateTemplate: (patch) =>
        set((s) => ({
          template: normalizeClearanceTemplate({ ...s.template, ...patch } as Record<string, unknown>),
        })),
      resetTemplate: () => set({ template: DEFAULT_ROSE_CLEARANCE_TEMPLATE }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ template: state.template }),
      migrate: (persisted) => {
        const p = persisted as { template?: Record<string, unknown> } | undefined;
        if (!p?.template) return { template: DEFAULT_ROSE_CLEARANCE_TEMPLATE };
        return { template: normalizeClearanceTemplate(p.template) };
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<State> | undefined;
        if (!p?.template) return current;
        return { ...current, template: normalizeClearanceTemplate(p.template as Record<string, unknown>) };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        useRoseClearanceTemplateStore.setState({
          template: normalizeClearanceTemplate(state.template as Record<string, unknown>),
        });
      },
    },
  ),
);
