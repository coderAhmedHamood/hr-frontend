'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AtsTenant, AtsUser, AtsJob, AtsForm, AtsApplicant, AtsPipelineStage, AtsApplicantScore } from './types';
import { uid, scoreApplicant } from './utils';
interface AtsState {
  currentTenantId: string;
  tenants: AtsTenant[];
  users: AtsUser[];
  jobs: AtsJob[];
  forms: AtsForm[];
  applicants: AtsApplicant[];
  setCurrentTenant: (id: string) => void;

  // Jobs
  addJob: (data: Omit<AtsJob, 'id' | 'createdAt'>) => void;
  updateJob: (id: string, data: Partial<Omit<AtsJob, 'id' | 'createdAt'>>) => void;
  deleteJob: (id: string) => void;

  // Forms
  addForm: (data: Omit<AtsForm, 'id' | 'createdAt'>) => void;
  updateForm: (id: string, data: Partial<Omit<AtsForm, 'id' | 'createdAt'>>) => void;
  deleteForm: (id: string) => void;

  // Applicants
  addApplicant: (data: Omit<AtsApplicant, 'id' | 'submittedAt' | 'pipelineStage' | 'score'>, autoScore?: boolean) => void;
  updateApplicant: (id: string, data: Partial<AtsApplicant>) => void;
  deleteApplicant: (id: string) => void;
  moveApplicantStage: (id: string, stage: AtsPipelineStage) => void;
  scoreApplicantById: (id: string) => void;

  // Tenant helpers
  getTenantJobs: () => AtsJob[];
  getTenantForms: () => AtsForm[];
  getTenantApplicants: () => AtsApplicant[];
  getJobApplicants: (jobId: string) => AtsApplicant[];
  getJobBySlug: (slug: string) => AtsJob | undefined;
  getFormByJobId: (jobId: string) => AtsForm | undefined;
}

export const useAtsStore = create<AtsState>()(
  persist(
    (set, get) => ({
      currentTenantId: 'tenant-1',
      tenants: [],
      users: [],
      jobs: [],
      forms: [],
      applicants: [],

      setCurrentTenant: (id) => set({ currentTenantId: id }),

      addJob: (data) => {
        const job: AtsJob = { ...data, id: `job-${uid()}`, createdAt: new Date().toISOString() };
        set((s) => ({ jobs: [job, ...s.jobs] }));
      },
      updateJob: (id, data) => {
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...data } : j)) }));
      },
      deleteJob: (id) => {
        set((s) => ({
          jobs: s.jobs.filter((j) => j.id !== id),
          forms: s.forms.filter((f) => f.jobId !== id),
          applicants: s.applicants.filter((a) => a.jobId !== id),
        }));
      },

      addForm: (data) => {
        const form: AtsForm = { ...data, id: `form-${uid()}`, createdAt: new Date().toISOString() };
        set((s) => ({ forms: [form, ...s.forms] }));
      },
      updateForm: (id, data) => {
        set((s) => ({ forms: s.forms.map((f) => (f.id === id ? { ...f, ...data } : f)) }));
      },
      deleteForm: (id) => {
        set((s) => ({ forms: s.forms.filter((f) => f.id !== id) }));
      },

      addApplicant: (data, autoScore = true) => {
        const { forms } = get();
        const form = forms.find((f) => f.id === data.formId);
        let score: AtsApplicantScore | null = null;
        if (autoScore && form) {
          score = scoreApplicant(data.answers, form.fields);
        }
        const applicant: AtsApplicant = {
          ...data,
          id: `app-${uid()}`,
          submittedAt: new Date().toISOString(),
          pipelineStage: 'applied',
          score,
        };
        set((s) => ({ applicants: [applicant, ...s.applicants] }));
      },
      updateApplicant: (id, data) => {
        set((s) => ({ applicants: s.applicants.map((a) => (a.id === id ? { ...a, ...data } : a)) }));
      },
      deleteApplicant: (id) => {
        set((s) => ({ applicants: s.applicants.filter((a) => a.id !== id) }));
      },
      moveApplicantStage: (id, stage) => {
        set((s) => ({
          applicants: s.applicants.map((a) => (a.id === id ? { ...a, pipelineStage: stage } : a)),
        }));
      },
      scoreApplicantById: (id) => {
        const { applicants, forms } = get();
        const applicant = applicants.find((a) => a.id === id);
        const form = applicant ? forms.find((f) => f.id === applicant.formId) : undefined;
        if (applicant && form) {
          const score = scoreApplicant(applicant.answers, form.fields);
          set((s) => ({
            applicants: s.applicants.map((a) => (a.id === id ? { ...a, score } : a)),
          }));
        }
      },

      getTenantJobs: () => {
        const { jobs, currentTenantId } = get();
        return jobs.filter((j) => j.tenantId === currentTenantId);
      },
      getTenantForms: () => {
        const { forms, currentTenantId } = get();
        return forms.filter((f) => f.tenantId === currentTenantId);
      },
      getTenantApplicants: () => {
        const { applicants, currentTenantId } = get();
        return applicants.filter((a) => a.tenantId === currentTenantId);
      },
      getJobApplicants: (jobId) => {
        const { applicants, currentTenantId } = get();
        return applicants.filter((a) => a.tenantId === currentTenantId && a.jobId === jobId);
      },
      getJobBySlug: (slug) => {
        const { jobs, currentTenantId } = get();
        return jobs.find((j) => j.tenantId === currentTenantId && j.slug === slug);
      },
      getFormByJobId: (jobId) => {
        const { forms, currentTenantId } = get();
        return forms.find((f) => f.tenantId === currentTenantId && f.jobId === jobId);
      },
    }),
    {
      name: 'ats-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: () => ({
        currentTenantId: 'tenant-1',
        tenants: [],
        users: [],
        jobs: [],
        forms: [],
        applicants: [],
      }),
    }
  )
);
