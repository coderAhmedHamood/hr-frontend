import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RecruitmentForm, RecruitmentApplicant } from './types';
import { uid } from './utils';

interface RecruitmentState {
  forms: RecruitmentForm[];
  applicants: RecruitmentApplicant[];
  addForm: (data: Omit<RecruitmentForm, 'id' | 'createdAt'>) => void;
  updateForm: (id: string, data: Partial<Omit<RecruitmentForm, 'id' | 'createdAt'>>) => void;
  deleteForm: (id: string) => void;
  addApplicant: (data: Omit<RecruitmentApplicant, 'id' | 'submittedAt'>) => void;
  deleteApplicant: (id: string) => void;
}

export const useRecruitmentStore = create<RecruitmentState>()(
  persist(
    (set) => ({
      forms: [],
      applicants: [],
      addForm: (data) => {
        const form: RecruitmentForm = {
          ...data,
          id: `rec-form-${uid()}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ forms: [form, ...s.forms] }));
      },
      updateForm: (id, data) => {
        set((s) => ({
          forms: s.forms.map((f) => (f.id === id ? { ...f, ...data } : f)),
        }));
      },
      deleteForm: (id) => {
        set((s) => ({
          forms: s.forms.filter((f) => f.id !== id),
          applicants: s.applicants.filter((a) => a.formId !== id),
        }));
      },
      addApplicant: (data) => {
        const applicant: RecruitmentApplicant = {
          ...data,
          id: `rec-app-${uid()}`,
          submittedAt: new Date().toISOString(),
        };
        set((s) => ({ applicants: [applicant, ...s.applicants] }));
      },
      deleteApplicant: (id) => {
        set((s) => ({ applicants: s.applicants.filter((a) => a.id !== id) }));
      },
    }),
    {
      name: 'recruitment-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: () => ({ forms: [], applicants: [] }),
    },
  ),
);
