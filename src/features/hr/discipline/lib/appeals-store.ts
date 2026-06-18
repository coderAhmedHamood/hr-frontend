import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { disciplineAppealsApi } from './api/discipline-appeals';
import type { DisciplineAppealResponseDto } from './api/discipline-appeals';
import type { HRDisciplineAppealRecord, HRAppealChannel, HRAppealStatus } from './types';

function mapApi(r: DisciplineAppealResponseDto): HRDisciplineAppealRecord {
  return {
    id: r.id,
    caseId: r.violationRecordId,
    caseNumber: r.linkedViolationRecordNumber,
    employeeId: r.subjectEmployeeId,
    employeeNameAr: '',
    date: r.appealDate,
    channel: r.channel as HRAppealChannel,
    status: r.status as HRAppealStatus,
    grounds: r.groundsAr,
    responseNote: r.responseNote ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

interface AppealsState {
  appeals: HRDisciplineAppealRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (d: Omit<HRDisciplineAppealRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, patch: Partial<HRDisciplineAppealRecord>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useHRDisciplineAppealsStore = create<AppealsState>()((set) => ({
  appeals: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await disciplineAppealsApi.getAll({ companyId, limit: 200 });
      set({ appeals: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (d) => {
    const companyId = getDefaultCompanyId() ?? '';
    const created = await disciplineAppealsApi.create({
      companyId,
      violationRecordId: d.caseId || undefined,
      appealDate: d.date,
      groundsAr: d.grounds,
      channel: d.channel,
      status: d.status,
    });
    set((s) => ({ appeals: [...s.appeals, mapApi(created)] }));
  },

  update: async (id, patch) => {
    const updatedBy = useAuthStore.getState().user?.email ?? useAuthStore.getState().user?.id ?? undefined;
    const updated = await disciplineAppealsApi.update(id, {
      appealDate: patch.date,
      groundsAr: patch.grounds,
      channel: patch.channel,
      responseNote: patch.responseNote,
      updatedBy,
    });
    set((s) => ({ appeals: s.appeals.map((a) => (a.id === id ? mapApi(updated) : a)) }));
  },

  remove: async (id) => {
    await disciplineAppealsApi.remove(id);
    set((s) => ({ appeals: s.appeals.filter((a) => a.id !== id) }));
  },
}));
