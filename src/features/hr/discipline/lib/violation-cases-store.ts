import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { violationRecordsApi } from './api/violation-records';
import type { ViolationRecordResponseDto } from './api/violation-records';
import type { HRViolationCaseRecord } from './types';

function mapApi(r: ViolationRecordResponseDto): HRViolationCaseRecord {
  return {
    id: r.id,
    caseNumber: r.recordNumber,
    employeeId: r.employeeId,
    employeeNameAr: '',
    employeeNameEn: '',
    date: r.violationDate,
    description: r.description,
    notes: r.notes ?? '',
    attachmentsNote: r.attachmentsNote ?? '',
    violationTypeId: r.violationTypeId,
    typeCode: '',
    typeNameAr: '',
    typeHasDeduction: false,
    typeDeductionKind: 'none',
    typeDeductionValue: 0,
    typeNeedsWarning: false,
    typeNeedsInvestigation: false,
    typeNeedsApproval: false,
    approvalTemplateId: null,
    status: 'submitted',
    requiredApprovers: [],
    currentApprovalIndex: 0,
    approvalLog: [],
    postedToPayroll: false,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

interface VCState {
  cases: HRViolationCaseRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: (params?: { employeeId?: string }) => Promise<void>;
  add: (d: {
    employeeId: string;
    violationTypeId: string;
    violationDate: string;
    description: string;
    notes?: string;
    attachmentsNote?: string;
  }) => Promise<HRViolationCaseRecord | null>;
  update: (id: string, patch: Partial<HRViolationCaseRecord>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useHRViolationCasesStore = create<VCState>()((set, get) => ({
  cases: [],
  isLoading: false,
  error: null,

  fetch: async (params) => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await violationRecordsApi.getAll({
        companyId,
        limit: 200,
        ...(params?.employeeId ? { employeeId: params.employeeId } : {}),
      });
      set({ cases: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (d) => {
    try {
      const companyId = getDefaultCompanyId() ?? '';
      const created = await violationRecordsApi.create({
        companyId,
        employeeId: d.employeeId,
        violationTypeId: d.violationTypeId,
        violationDate: d.violationDate,
        description: d.description,
        notes: d.notes ?? null,
        attachmentsNote: d.attachmentsNote ?? null,
      });
      const mapped = mapApi(created);
      set((s) => ({ cases: [...s.cases, mapped] }));
      return mapped;
    } catch {
      return null;
    }
  },

  update: async (id, patch) => {
    // Only fields that map to the backend are sent; other fields are updated locally only
    const hasBackendFields =
      patch.date != null ||
      patch.description != null ||
      patch.notes != null ||
      patch.attachmentsNote != null;

    if (hasBackendFields) {
      const updated = await violationRecordsApi.update(id, {
        ...(patch.date != null ? { violationDate: patch.date } : {}),
        ...(patch.description != null ? { description: patch.description } : {}),
        ...(patch.notes != null ? { notes: patch.notes } : {}),
        ...(patch.attachmentsNote != null ? { attachmentsNote: patch.attachmentsNote } : {}),
      });
      set((s) => ({
        cases: s.cases.map((c) => (c.id === id ? { ...mapApi(updated), ...pick(patch, localOnlyKeys) } : c)),
      }));
    } else {
      // Local-only patch (status, approval fields, etc.)
      const prev = get().cases.find((c) => c.id === id);
      if (!prev) return;
      set((s) => ({
        cases: s.cases.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c)),
      }));
    }
  },

  remove: async (id) => {
    await violationRecordsApi.remove(id);
    set((s) => ({ cases: s.cases.filter((c) => c.id !== id) }));
  },
}));

const localOnlyKeys: Array<keyof HRViolationCaseRecord> = [
  'status', 'requiredApprovers', 'currentApprovalIndex', 'approvalLog', 'postedToPayroll',
  'typeCode', 'typeNameAr', 'typeHasDeduction', 'typeDeductionKind', 'typeDeductionValue',
  'typeNeedsWarning', 'typeNeedsInvestigation', 'typeNeedsApproval', 'approvalTemplateId',
  'employeeNameAr', 'employeeNameEn',
];

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}
