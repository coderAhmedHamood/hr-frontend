import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { disciplineInvestigationsApi } from './api/discipline-investigations';
import { ApiError } from '@/features/hr/lib/api/client';
import type { DisciplineInvestigationResponseDto } from './api/discipline-investigations';
import type { HRDisciplineInvestigationRecord, HRInvestigationRecommendation } from './types';

function mapApi(r: DisciplineInvestigationResponseDto): HRDisciplineInvestigationRecord {
  const recommendationType = (r.recommendation ?? null) as HRInvestigationRecommendation | null;
  return {
    id: r.id,
    caseId: r.violationRecordId,
    caseNumber: r.linkedViolationRecordNumber,
    employeeId: r.subjectEmployeeId,
    employeeNameAr: '',
    investigatorEmployeeId: r.investigatorEmployeeId,
    investigatorName: r.investigatorEmployeeId ?? '',
    date: r.investigationDate,
    employeeStatement: r.employeeStatement ?? '',
    witnessStatement: r.witnessStatement ?? '',
    result: r.result,
    recommendation: r.recommendation ?? '',
    recommendationType,
    deductionType: r.deductionType ?? null,
    deductionValue: r.deductionValue != null ? Number(r.deductionValue) : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

interface InvestigationsState {
  investigations: HRDisciplineInvestigationRecord[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: () => Promise<void>;
  add: (d: Omit<HRDisciplineInvestigationRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, patch: Partial<HRDisciplineInvestigationRecord>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useHRDisciplineInvestigationsStore = create<InvestigationsState>()((set) => ({
  investigations: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await disciplineInvestigationsApi.getAll({ companyId, limit: 200 });
      set({ investigations: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
    }
  },

  add: async (d) => {
    const companyId = getDefaultCompanyId() ?? '';
    const created = await disciplineInvestigationsApi.create({
      companyId,
      violationRecordId: d.caseId || undefined,
    investigatorEmployeeId: d.investigatorName,
    investigationDate: d.date,
    result: 'pending',
  });
    const updated = await disciplineInvestigationsApi.submitResults(created.id, {
      investigatorEmployeeId: d.investigatorName,
      employeeStatement: d.employeeStatement || null,
      witnessStatement: d.witnessStatement || null,
      result: d.result === 'pending' ? 'proven' : d.result,
      recommendation: d.recommendationType ?? null,
      ...(d.recommendationType === 'deduction' && d.deductionType
        ? { deductionType: d.deductionType, deductionValue: d.deductionValue ?? undefined }
        : {}),
    });
    set((s) => ({ investigations: [...s.investigations, mapApi(updated)] }));
  },

  update: async (id, patch) => {
    const existing = useHRDisciplineInvestigationsStore.getState().investigations.find((i) => i.id === id);
    if (!existing) return;
    const updated = await disciplineInvestigationsApi.submitResults(id, {
      investigatorEmployeeId: patch.investigatorName ?? existing.investigatorName,
      employeeStatement: patch.employeeStatement ?? existing.employeeStatement,
      witnessStatement: patch.witnessStatement ?? existing.witnessStatement,
      result: (patch.result ?? existing.result) === 'pending' ? 'proven' : (patch.result ?? existing.result) as 'proven' | 'not_proven',
      recommendation: patch.recommendationType !== undefined ? patch.recommendationType : existing.recommendationType,
    });
    set((s) => ({ investigations: s.investigations.map((i) => (i.id === id ? mapApi(updated) : i)) }));
  },

  remove: async (id) => {
    await disciplineInvestigationsApi.remove(id);
    set((s) => ({ investigations: s.investigations.filter((i) => i.id !== id) }));
  },
}));
