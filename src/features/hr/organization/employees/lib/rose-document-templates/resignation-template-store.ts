import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_ROSE_RESIGNATION_TEMPLATE,
  normalizeResignationTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-resignation-template';
import type { RoseResignationTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const STORAGE_KEY = 'rose-hr-resignation-template-v2';

type State = {
  template: RoseResignationTemplateContent;
  updateTemplate: (patch: Partial<RoseResignationTemplateContent>) => void;
  resetTemplate: () => void;
};

export function getNormalizedResignationTemplate(
  state: Pick<State, 'template'> = useRoseResignationTemplateStore.getState(),
): RoseResignationTemplateContent {
  return normalizeResignationTemplate(state.template as Record<string, unknown>);
}

export const useRoseResignationTemplateStore = create<State>()(
  persist(
    (set) => ({
      template: DEFAULT_ROSE_RESIGNATION_TEMPLATE,
      updateTemplate: (patch) =>
        set((s) => ({
          template: normalizeResignationTemplate({
            ...s.template,
            ...patch,
          } as Record<string, unknown>),
        })),
      resetTemplate: () => set({ template: DEFAULT_ROSE_RESIGNATION_TEMPLATE }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 3,
      partialize: (state) => ({ template: state.template }),
      migrate: (persisted) => {
        const p = persisted as { template?: Record<string, unknown> } | undefined;
        if (!p?.template) return { template: DEFAULT_ROSE_RESIGNATION_TEMPLATE };
        return { template: normalizeResignationTemplate(p.template) };
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<State> | undefined;
        if (!p?.template) return current;
        return {
          ...current,
          template: normalizeResignationTemplate(p.template as Record<string, unknown>),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        useRoseResignationTemplateStore.setState({
          template: normalizeResignationTemplate(state.template as Record<string, unknown>),
        });
      },
    },
  ),
);
