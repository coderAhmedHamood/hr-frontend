import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type RoseTemplateStoreState<T> = {
  template: T;
  updateTemplate: (patch: Partial<T>) => void;
  resetTemplate: () => void;
};

type CreateRoseTemplateStoreConfig<T> = {
  storageKey: string;
  version: number;
  defaultTemplate: T;
  normalize: (raw: Record<string, unknown>) => T;
};

export function createRoseTemplateStore<T extends Record<string, unknown>>(
  config: CreateRoseTemplateStoreConfig<T>,
) {
  const { storageKey, version, defaultTemplate, normalize } = config;

  type State = RoseTemplateStoreState<T>;

  const useStore = create<State>()(
    persist(
      (set) => ({
        template: defaultTemplate,
        updateTemplate: (patch) =>
          set((s) => ({
            template: normalize({ ...s.template, ...patch } as Record<string, unknown>),
          })),
        resetTemplate: () => set({ template: defaultTemplate }),
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => localStorage),
        version,
        partialize: (state) => ({ template: state.template }),
        migrate: (persisted) => {
          const p = persisted as { template?: Record<string, unknown> } | undefined;
          if (!p?.template) return { template: defaultTemplate };
          return { template: normalize(p.template) };
        },
        merge: (persisted, current) => {
          const p = persisted as Partial<State> | undefined;
          if (!p?.template) return current;
          return { ...current, template: normalize(p.template as Record<string, unknown>) };
        },
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          useStore.setState({
            template: normalize(state.template as Record<string, unknown>),
          });
        },
      },
    ),
  );

  function getNormalizedTemplate(
    state: Pick<State, 'template'> = useStore.getState(),
  ): T {
    return normalize(state.template as Record<string, unknown>);
  }

  return { useStore, getNormalizedTemplate };
}
