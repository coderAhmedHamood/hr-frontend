import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_ROSE_EXPERIENCE_TEMPLATE,
  normalizeExperienceTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-experience-template';
import type { RoseExperienceTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const STORAGE_KEY = 'rose-hr-experience-template-v1';

type State = {
  template: RoseExperienceTemplateContent;
  updateTemplate: (patch: Partial<RoseExperienceTemplateContent>) => void;
  resetTemplate: () => void;
};

export const useRoseExperienceTemplateStore = create<State>()(
  persist(
    (set) => ({
      template: DEFAULT_ROSE_EXPERIENCE_TEMPLATE,
      updateTemplate: (patch) =>
        set((s) => ({
          template: normalizeExperienceTemplate({ ...s.template, ...patch } as Record<string, unknown>),
        })),
      resetTemplate: () => set({ template: DEFAULT_ROSE_EXPERIENCE_TEMPLATE }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ template: state.template }),
      migrate: (persisted) => {
        const p = persisted as { template?: Record<string, unknown> } | undefined;
        if (!p?.template) return { template: DEFAULT_ROSE_EXPERIENCE_TEMPLATE };
        return { template: normalizeExperienceTemplate(p.template) };
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<State> | undefined;
        if (!p?.template) return current;
        return { ...current, template: normalizeExperienceTemplate(p.template as Record<string, unknown>) };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        useRoseExperienceTemplateStore.setState({
          template: normalizeExperienceTemplate(state.template as Record<string, unknown>),
        });
      },
    },
  ),
);
