import { create } from 'zustand';
import { STATUS_PILL } from '@/shared/status-pill-classes';
import { AR_STATUS } from '@/shared/i18n/ar';
import {
  TEMPLATE_CONTRACT_NATURE_LABELS,
  TEMPLATE_WORK_ARRANGEMENT_LABELS,
} from '@/features/hr/contracts/contract-templates/constants/contract-template-options';
import type {
  ContractNature,
  WorkArrangement,
} from '@/features/hr/contracts/contract-templates/types/contract-template';
import { employeeContractsApi, type ApiEmployeeContract } from './contracts-api';
import { ApiError } from '@/features/hr/lib/api/client';
import { fetchAllEmployeeContracts } from './fetch-all-employee-contracts';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

// ─── Types ────────────────────────────────────────────────────────────────────

/** مطابق لـ backend ContractNature enum */
export type HRContractNature = ContractNature;

/** مطابق لـ backend WorkArrangement enum */
export type HRWorkArrangement = WorkArrangement;

export type HRContractLifecycleStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'superseded' | 'cancelled';

export type HRContractAllowanceLine = {
  allowanceTypeId: string;
  allowanceTypeNameAr: string;
  allowanceTypeCode: string;
  amount: number;
  sortOrder: number;
};

export type HRContractRecord = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  branchNameAr: string;
  contractNumber: string;
  contractType: HRContractNature;
  workArrangement: HRWorkArrangement;
  startDate: string;
  endDate: string;
  probationDays: number | null;
  baseSalary: number;
  currency: string;
  status: HRContractLifecycleStatus;
  templateId: string | null;
  allowanceLines: HRContractAllowanceLine[];
  allowancesNote: string;
  deductionsNote: string;
  amendsContractId: string | null;
  supersededByContractId: string | null;
  earlyTerminationReason: string | null;
  articleIds: string[];
  annualLeaveDays: number | null;
  employeeSigned: boolean;
  rejectionReason: string | null;
  signedAt: string | null;
  updatedAt: string;
};

export type HRContractDraft = Omit<HRContractRecord, 'id' | 'updatedAt'>;
export type ActivateResult = { ok: true } | { ok: false; message: string };

// ─── Mapping ──────────────────────────────────────────────────────────────────

export function mapEmployeeContractFromApi(c: ApiEmployeeContract): HRContractRecord {
  return {
    id: c.id,
    employeeId: c.employeeId,
    employeeNameAr: c.employeeNameAr ?? '',
    branchNameAr: c.branchNameAr ?? '',
    contractNumber: c.contractNumber,
    contractType: c.contractNature as HRContractNature,
    workArrangement: c.workArrangement as HRWorkArrangement,
    startDate: c.startDate,
    endDate: c.endDate ?? '',
    probationDays: c.probationDays ?? null,
    baseSalary: Number(c.baseSalary) || 0,
    currency: c.currency,
    status: c.status as HRContractLifecycleStatus,
    templateId: c.contractTemplateId ?? null,
    allowanceLines: (c.allowanceLines ?? []).map((l, i) => ({
      allowanceTypeId: l.allowanceTypeId,
      allowanceTypeNameAr: l.allowanceTypeNameAr ?? '',
      allowanceTypeCode: l.allowanceTypeCode ?? '',
      amount: Number(l.amount) || 0,
      sortOrder: l.sortOrder ?? i,
    })),
    allowancesNote: c.allowancesNote ?? '',
    deductionsNote: c.deductionsNote ?? '',
    amendsContractId: c.amendsContractId ?? null,
    supersededByContractId: c.supersededByContractId ?? null,
    earlyTerminationReason: c.earlyTerminationReason ?? null,
    articleIds: (c.articles ?? []).map(a => a.contractArticleId),
    annualLeaveDays: c.annualLeaveDays ?? null,
    employeeSigned: c.employeeSigned ?? false,
    rejectionReason: c.rejectionReason ?? null,
    signedAt: c.signedAt ?? null,
    updatedAt: c.updatedAt,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface HRContractsState {
  contracts: HRContractRecord[];
  loadedCompanyId: string | null;
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: (params?: { employeeId?: string }) => Promise<void>;
  add: (data: HRContractDraft) => Promise<{ id: string; contractNumber: string }>;
  update: (id: string, patch: Partial<HRContractDraft>) => Promise<ActivateResult>;
  remove: (id: string) => Promise<ActivateResult>;
  activate: (id: string, leaveTypeId?: string) => Promise<ActivateResult>;
  employeeAccept: (id: string) => Promise<ActivateResult>;
  terminate: (id: string, reason: string) => Promise<ActivateResult>;
  archive: (id: string) => Promise<ActivateResult>;
  createAmendmentDraft: (activeContractId: string) => Promise<{ ok: true; id: string } | { ok: false; message: string }>;
  syncExpiredByEndDate: () => void;
}

let contractsFetchPromise: Promise<void> | null = null;

export const useHRContractsStore = create<HRContractsState>()((set, get) => ({
  contracts: [],
  loadedCompanyId: null,
  isLoading: false,
  error: null,

  fetch: async (params) => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;

    const scopedFetch = Boolean(params?.employeeId);
    if (!scopedFetch) {
      const { loadedCompanyId, isLoading } = get();
      if (loadedCompanyId === companyId) return;
      if (isLoading && contractsFetchPromise) return contractsFetchPromise;
    }

    const run = async () => {
      set({ isLoading: true, error: null });
      try {
        const contracts = await fetchAllEmployeeContracts(params);
        set({
          contracts,
          loadedCompanyId: scopedFetch ? get().loadedCompanyId : companyId,
          isLoading: false,
        });
      } catch (e) {
        set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
      }
    };

    if (scopedFetch) {
      await run();
      return;
    }

    contractsFetchPromise = run().finally(() => {
      contractsFetchPromise = null;
    });
    return contractsFetchPromise;
  },

  add: async (data) => {
    const companyId = getDefaultCompanyId() ?? '';
    const contractNumber = data.contractNumber?.trim();
    const currency = data.currency?.trim().toUpperCase();
    const created = await employeeContractsApi.create({
      companyId,
      employeeId: data.employeeId,
      ...(contractNumber ? { contractNumber } : {}),
      contractNature: data.contractType,
      workArrangement: data.workArrangement,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      probationDays: data.probationDays ?? undefined,
      annualLeaveDays: data.annualLeaveDays ?? undefined,
      baseSalary: data.baseSalary,
      ...(currency && currency !== 'SAR' ? { currency } : {}),
      status: data.status,
      allowancesNote: data.allowancesNote || undefined,
      deductionsNote: data.deductionsNote || undefined,
      amendsContractId: data.amendsContractId ?? undefined,
      contractTemplateId: data.templateId ?? undefined,
      applyTemplateDefaults: data.templateId ? true : undefined,
      articleIds: data.articleIds.length > 0 ? data.articleIds : undefined,
      allowanceLines: data.allowanceLines
        .filter(l => l.allowanceTypeId)
        .map((l, i) => ({ allowanceTypeId: l.allowanceTypeId, amount: l.amount, sortOrder: i })),
    });
    const row = mapEmployeeContractFromApi(created);
    set(s => ({ contracts: [row, ...s.contracts] }));
    return { id: created.id, contractNumber: created.contractNumber };
  },

  update: async (id, patch) => {
    try {
      const updated = await employeeContractsApi.update(id, {
        contractNature: patch.contractType,
        workArrangement: patch.workArrangement,
        startDate: patch.startDate,
        endDate: patch.endDate,
        probationDays: patch.probationDays ?? undefined,
        annualLeaveDays: patch.annualLeaveDays ?? undefined,
        baseSalary: patch.baseSalary,
        currency: patch.currency,
        allowancesNote: patch.allowancesNote,
        deductionsNote: patch.deductionsNote,
        articleIds: patch.articleIds,
        allowanceLines: patch.allowanceLines
          ?.filter(l => l.allowanceTypeId)
          .map((l, i) => ({ allowanceTypeId: l.allowanceTypeId, amount: l.amount, sortOrder: i })),
      });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(c => c.id === id ? row : c) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  remove: async (id) => {
    try {
      await employeeContractsApi.delete(id);
      set(s => ({ contracts: s.contracts.filter(c => c.id !== id) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  activate: async (id, leaveTypeId) => {
    try {
      const updated = await employeeContractsApi.update(id, {
        status: 'active',
        ...(leaveTypeId ? { leaveTypeId } : {}),
      });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(x => x.id === id ? row : x) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  employeeAccept: async (id) => {
    try {
      const userId = useAuthStore.getState().user?.id ?? undefined;
      const updated = await employeeContractsApi.employeeDecision(id, {
        decision: 'accept',
        ...(userId ? { decidedBy: userId } : {}),
      });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(x => x.id === id ? row : x) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  terminate: async (id, reason) => {
    try {
      const updated = await employeeContractsApi.update(id, {
        status: 'terminated',
        earlyTerminationReason: reason.trim() || 'إنهاء مبكر',
      });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(x => x.id === id ? row : x) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  archive: async (id) => {
    try {
      const updated = await employeeContractsApi.update(id, { status: 'cancelled' });
      const row = mapEmployeeContractFromApi(updated);
      set(s => ({ contracts: s.contracts.map(x => x.id === id ? row : x) }));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  createAmendmentDraft: async (activeContractId) => {
    let parent = get().contracts.find(x => x.id === activeContractId);
    if (!parent) {
      try {
        parent = mapEmployeeContractFromApi(await employeeContractsApi.get(activeContractId));
      } catch (e) {
        return { ok: false, message: (e as Error).message };
      }
    }
    const companyId = getDefaultCompanyId() ?? '';
    try {
      const created = await employeeContractsApi.create({
        companyId,
        employeeId: parent.employeeId,
        contractNumber: `${parent.contractNumber}-AMD-${Date.now().toString(36).toUpperCase()}`,
        contractNature: parent.contractType,
        workArrangement: parent.workArrangement,
        startDate: parent.startDate,
        endDate: parent.endDate || undefined,
        probationDays: parent.probationDays ?? undefined,
        annualLeaveDays: parent.annualLeaveDays ?? undefined,
        baseSalary: parent.baseSalary,
        currency: parent.currency,
        status: 'draft',
        amendsContractId: parent.id,
        contractTemplateId: parent.templateId ?? undefined,
        articleIds: parent.articleIds.length > 0 ? parent.articleIds : undefined,
        allowanceLines: parent.allowanceLines
          .filter(l => l.allowanceTypeId)
          .map((l, i) => ({ allowanceTypeId: l.allowanceTypeId, amount: l.amount, sortOrder: i })),
        allowancesNote: parent.allowancesNote || undefined,
        deductionsNote: parent.deductionsNote || undefined,
      });
      const row = mapEmployeeContractFromApi(created);
      set(s => ({ contracts: [row, ...s.contracts] }));
      return { ok: true, id: created.id };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  syncExpiredByEndDate: () => {
    // Status expiration is managed server-side; this is a no-op client hint.
  },
}));

// ─── Labels & colors ──────────────────────────────────────────────────────────

export const CONTRACT_NATURE_LABELS = TEMPLATE_CONTRACT_NATURE_LABELS;

export const WORK_ARRANGEMENT_LABELS = TEMPLATE_WORK_ARRANGEMENT_LABELS;

export function contractNatureLabel(value: string): string {
  return (CONTRACT_NATURE_LABELS as Record<string, string>)[value] ?? value;
}

export function workArrangementLabel(value: string): string {
  return (WORK_ARRANGEMENT_LABELS as Record<string, string>)[value] ?? value;
}

export const CONTRACT_STATUS_LABELS: Record<HRContractLifecycleStatus, string> = {
  draft: AR_STATUS.draft,
  pending_signature: 'بانتظار الموافقة',
  active: 'نشط',
  expired: 'منتهي',
  terminated: 'مُنهى مبكراً',
  superseded: 'مستبدل',
  cancelled: AR_STATUS.cancelledShort,
};

export const CONTRACT_STATUS_COLORS: Record<HRContractLifecycleStatus, string> = {
  draft: STATUS_PILL.muted,
  pending_signature: STATUS_PILL.info,
  active: STATUS_PILL.approved,
  expired: STATUS_PILL.warning,
  terminated: STATUS_PILL.rejected,
  superseded: STATUS_PILL.calculated,
  cancelled: STATUS_PILL.cancelled,
};

export function formatEmployeeSignedLabel(signed: boolean): string {
  return signed ? 'وافق على العقد' : 'لم يوافق بعد';
}

export function normalizeContractRow(raw: Record<string, unknown>): HRContractRecord {
  return raw as HRContractRecord;
}
