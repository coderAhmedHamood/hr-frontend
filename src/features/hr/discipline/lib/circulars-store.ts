import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { disciplineCircularsApi } from './api/discipline-circulars';
import { ApiError } from '@/features/hr/lib/api/client';
import type { DisciplineCircularResponseDto, CircularAudienceTypeDto } from './api/discipline-circulars';
import type { HRDisciplineCircularRecord, HRDisciplineCircularAudience } from './types';

function mapAudienceType(t: CircularAudienceTypeDto): HRDisciplineCircularAudience {
  switch (t) {
    case 'all_employees': return 'all';
    case 'specific_employees': return 'employees';
    case 'departments': return 'department';
    case 'branches': return 'branch';
  }
}

function mapApi(r: DisciplineCircularResponseDto): HRDisciplineCircularRecord {
  const audience = mapAudienceType(r.audienceType);
  const targetIds = r.audienceTargetIds ?? [];

  let targetEmployeeIds: string[] = [];
  let branchIds: string[] = [];
  let departmentIds: string[] = [];

  if (audience === 'employees') targetEmployeeIds = targetIds;
  else if (audience === 'branch') branchIds = targetIds;
  else if (audience === 'department') departmentIds = targetIds;

  return {
    id: r.id,
    date: r.issueDate,
    titleAr: r.titleAr ?? '',
    bodyAr: r.bodyAr,
    audience,
    targetEmployeeIds,
    branchIds,
    branchNamesArSnapshot: '',
    departmentIds,
    departmentNamesArSnapshot: '',
    audienceSummaryAr: r.audienceType === 'all_employees' ? 'جميع الموظفين' : '',
    sentAt: r.sentAt,
    createdAt: r.createdAt,
  };
}

function mapAudienceToBackend(d: Omit<HRDisciplineCircularRecord, 'id' | 'createdAt'>): {
  audienceType: CircularAudienceTypeDto;
  audienceTargetIds: string[];
} {
  switch (d.audience) {
    case 'all':
      return { audienceType: 'all_employees', audienceTargetIds: [] };
    case 'employees':
      return { audienceType: 'specific_employees', audienceTargetIds: d.targetEmployeeIds };
    case 'department':
      return { audienceType: 'departments', audienceTargetIds: d.departmentIds };
    case 'branch':
      return { audienceType: 'branches', audienceTargetIds: d.branchIds };
  }
}

interface CircularsState {
  circulars: HRDisciplineCircularRecord[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: () => Promise<void>;
  add: (d: Omit<HRDisciplineCircularRecord, 'id' | 'createdAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  markSent: (id: string) => Promise<void>;
}

export const useHRDisciplineCircularsStore = create<CircularsState>()((set) => ({
  circulars: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await disciplineCircularsApi.getAll({ companyId, limit: 200 });
      set({ circulars: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
    }
  },

  add: async (d) => {
    const companyId = getDefaultCompanyId() ?? '';
    const { audienceType, audienceTargetIds } = mapAudienceToBackend(d);
    const created = await disciplineCircularsApi.create({
      companyId,
      titleAr: d.titleAr || null,
      bodyAr: d.bodyAr,
      issueDate: d.date,
      audienceType,
      audienceTargetIds,
    });
    set((s) => ({ circulars: [...s.circulars, mapApi(created)] }));
  },

  remove: async (id) => {
    await disciplineCircularsApi.remove(id);
    set((s) => ({ circulars: s.circulars.filter((c) => c.id !== id) }));
  },

  markSent: async (id) => {
    const updated = await disciplineCircularsApi.send(id);
    set((s) => ({ circulars: s.circulars.map((c) => (c.id === id ? mapApi(updated) : c)) }));
  },
}));
