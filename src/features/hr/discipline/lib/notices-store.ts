import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { disciplineNoticesApi } from './api/discipline-notices';
import { ApiError } from '@/features/hr/lib/api/client';
import type { DisciplineNoticeResponseDto } from './api/discipline-notices';
import type { HRDisciplineNoticeRecord, HRDisciplineNoticeKind } from './types';

function mapApi(r: DisciplineNoticeResponseDto): HRDisciplineNoticeRecord {
  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeNameAr: '',
    kind: r.noticeKind as HRDisciplineNoticeKind,
    reasonAr: r.reasonAr,
    date: r.noticeDate,
    linkedCaseId: r.violationRecordId ?? '',
    attachmentsNote: r.attachmentsNote ?? '',
    createdAt: r.createdAt,
  };
}

interface NoticesState {
  notices: HRDisciplineNoticeRecord[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: () => Promise<void>;
  add: (d: Omit<HRDisciplineNoticeRecord, 'id' | 'createdAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useHRDisciplineNoticesStore = create<NoticesState>()((set) => ({
  notices: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await disciplineNoticesApi.getAll({ companyId, limit: 200 });
      set({ notices: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
    }
  },

  add: async (d) => {
    const companyId = getDefaultCompanyId() ?? '';
    const created = await disciplineNoticesApi.create({
      companyId,
      employeeId: d.employeeId,
      noticeKind: d.kind,
      reasonAr: d.reasonAr,
      noticeDate: d.date,
      violationRecordId: d.linkedCaseId || undefined,
      attachmentsNote: d.attachmentsNote || undefined,
    });
    set((s) => ({ notices: [...s.notices, mapApi(created)] }));
  },

  remove: async (id) => {
    await disciplineNoticesApi.remove(id);
    set((s) => ({ notices: s.notices.filter((n) => n.id !== id) }));
  },
}));
