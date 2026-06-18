import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { violationTypesApi } from './api/violation-types';
import type { ViolationTypeResponseDto } from './api/violation-types';
import type { HRViolationTypeRecord } from './types';

function mapApi(r: ViolationTypeResponseDto): HRViolationTypeRecord {
  return {
    id: r.id,
    code: r.code,
    nameAr: r.nameAr,
    nameEn: r.nameEn ?? '',
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    hasDeduction: r.hasDeduction,
    deductionKind: r.deductionKind ?? 'none',
    deductionValue: r.deductionValue != null ? parseFloat(r.deductionValue) : 0,
    needsWarning: r.needsWarning,
    needsInvestigation: r.needsInvestigation,
    needsApproval: r.needsApproval,
    approvalTemplateId: r.approvalTemplateId,
    updatedAt: r.updatedAt,
  };
}

interface VTState {
  types: HRViolationTypeRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (d: Omit<HRViolationTypeRecord, 'id' | 'updatedAt'>) => Promise<{ ok: boolean; error?: string }>;
  update: (id: string, d: Partial<Omit<HRViolationTypeRecord, 'id'>>) => Promise<{ ok: boolean; error?: string }>;
  remove: (id: string) => Promise<void>;
}

export const useHRViolationTypesStore = create<VTState>()((set) => ({
  types: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await violationTypesApi.getAll({ companyId, limit: 200 });
      set({ types: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (d) => {
    try {
      const companyId = getDefaultCompanyId() ?? '';
      const created = await violationTypesApi.create({
        companyId,
        code: d.code.toUpperCase().trim(),
        nameAr: d.nameAr,
        nameEn: d.nameEn || null,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
        hasDeduction: d.hasDeduction,
        deductionKind: d.deductionKind,
        deductionValue: d.deductionValue,
        needsWarning: d.needsWarning,
        needsInvestigation: d.needsInvestigation,
        needsApproval: d.needsApproval,
        approvalTemplateId: d.approvalTemplateId,
      });
      set((s) => ({ types: [...s.types, mapApi(created)] }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  update: async (id, d) => {
    try {
      const updated = await violationTypesApi.update(id, {
        ...(d.code != null ? { code: d.code.toUpperCase().trim() } : {}),
        ...(d.nameAr != null ? { nameAr: d.nameAr } : {}),
        ...(d.nameEn != null ? { nameEn: d.nameEn } : {}),
        ...(d.sortOrder != null ? { sortOrder: d.sortOrder } : {}),
        ...(d.isActive != null ? { isActive: d.isActive } : {}),
        ...(d.hasDeduction != null ? { hasDeduction: d.hasDeduction } : {}),
        ...(d.deductionKind != null ? { deductionKind: d.deductionKind } : {}),
        ...(d.deductionValue != null ? { deductionValue: d.deductionValue } : {}),
        ...(d.needsWarning != null ? { needsWarning: d.needsWarning } : {}),
        ...(d.needsInvestigation != null ? { needsInvestigation: d.needsInvestigation } : {}),
        ...(d.needsApproval != null ? { needsApproval: d.needsApproval } : {}),
        ...(d.approvalTemplateId !== undefined ? { approvalTemplateId: d.approvalTemplateId } : {}),
      });
      set((s) => ({ types: s.types.map((t) => (t.id === id ? mapApi(updated) : t)) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  remove: async (id) => {
    await violationTypesApi.remove(id);
    set((s) => ({ types: s.types.filter((t) => t.id !== id) }));
  },
}));
