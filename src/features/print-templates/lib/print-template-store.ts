'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_PRINT_TEMPLATE_SETTINGS,
  type PrintTemplateSettings,
} from '@/features/print-templates/domain/types';

/**
 * Print template settings per company.
 *
 * Front-end only for now (browser storage), while the design settles; the
 * backend endpoint replaces this store without changing its callers.
 */
type PrintTemplateState = {
  byCompany: Record<string, PrintTemplateSettings>;
  save: (companyId: string, settings: PrintTemplateSettings) => void;
};

export const usePrintTemplateStore = create<PrintTemplateState>()(
  persist(
    (set) => ({
      byCompany: {},
      save: (companyId, settings) =>
        set((state) => ({ byCompany: { ...state.byCompany, [companyId]: settings } })),
    }),
    {
      name: 'erp.print-templates.v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Saved settings merged over the defaults (new fields get their default). */
export function resolvePrintTemplateSettings(
  saved: PrintTemplateSettings | undefined,
): PrintTemplateSettings {
  const d = DEFAULT_PRINT_TEMPLATE_SETTINGS;
  if (!saved) return d;
  return {
    ...d,
    ...saved,
    header: { ...d.header, ...saved.header },
    footer: { ...d.footer, ...saved.footer },
  };
}

export function usePrintTemplateSettings(companyId: string | null | undefined): PrintTemplateSettings {
  const saved = usePrintTemplateStore((s) => (companyId ? s.byCompany[companyId] : undefined));
  return resolvePrintTemplateSettings(saved);
}
