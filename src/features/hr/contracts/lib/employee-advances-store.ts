import { create } from 'zustand';
import { AR_STATUS } from '@/shared/i18n/ar';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  employeeAdvancesApi,
  type EmployeeAdvanceDecisionDto,
  type AdvanceStatusDto,
} from './api/employee-advances';
import {
  duplicateAdvanceNumberMessage,
  isDuplicateAdvanceNumberError,
} from './employee-advance-errors';
import { ApiError } from '@/features/hr/lib/api/client';
import type { RequestApproverStatesSnapshot } from '@/features/hr/requests/lib/api/request-approver-states-types';
import { mapEmployeeAdvanceFromApi } from './employee-advances-mapper';

export { mapEmployeeAdvanceFromApi } from './employee-advances-mapper';
export type { EmployeeNameLookup } from './employee-advances-mapper';

const CREATE_RETRY_ATTEMPTS = 3;
const CREATE_RETRY_DELAY_MS = 200;

export type HREmployeeAdvanceStatus = AdvanceStatusDto;

export type HREmployeeAdvanceKind = 'housing' | 'personal' | 'urgent' | 'violation';

export type HREmployeeAdvanceRepaymentMode = 'by_months' | 'by_monthly_amount';

export type HREmployeeAdvance = {
  id: string;
  advanceNumber: string;
  employeeId: string;
  employeeNameAr: string;
  branchNameAr: string | null;
  amount: number;
  currency: string;
  advanceDate: string;
  note: string;
  reasonAr: string;
  status: HREmployeeAdvanceStatus;
  advanceKind: HREmployeeAdvanceKind;
  repaymentMode: HREmployeeAdvanceRepaymentMode;
  repaymentMonths: number | null;
  monthlyInstallmentAmount: number | null;
  totalRepaidAmount: number;
  remainingAmount: number;
  approvedAt: string | null;
  rejectedAt: string | null;
  decisionNotes: string | null;
  disbursedAt: string | null;
  createdAt: string;
  approverStates: RequestApproverStatesSnapshot | null;
  updatedAt: string;
};

export const EDITABLE_ADVANCE_STATUSES: HREmployeeAdvanceStatus[] = [
  'draft',
  'pending_approval',
  'rejected',
];

export const DELETABLE_ADVANCE_STATUSES: HREmployeeAdvanceStatus[] = [
  'draft',
  'rejected',
  'cancelled',
];

function toBackendKind(k: HREmployeeAdvanceKind): import('./api/employee-advances').AdvanceKindDto {
  if (k === 'housing') return 'housing';
  if (k === 'urgent') return 'emergency';
  return 'salary_advance';
}

function toBackendRepaymentMode(m: HREmployeeAdvanceRepaymentMode): import('./api/employee-advances').RepaymentModeDto {
  if (m === 'by_months') return 'monthly_payroll';
  return 'flexible';
}

type State = {
  items: HREmployeeAdvance[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: (params?: { employeeId?: string; status?: HREmployeeAdvanceStatus; advanceDateFrom?: string; advanceDateTo?: string }) => Promise<void>;
  add: (a: Omit<HREmployeeAdvance, 'id' | 'advanceNumber' | 'approvedAt' | 'updatedAt' | 'status' | 'approverStates' | 'rejectedAt' | 'decisionNotes' | 'reasonAr' | 'branchNameAr' | 'totalRepaidAmount' | 'remainingAmount' | 'disbursedAt' | 'createdAt'>) => Promise<HREmployeeAdvance>;
  update: (id: string, patch: Partial<Omit<HREmployeeAdvance, 'id' | 'advanceNumber' | 'approvedAt' | 'updatedAt' | 'reasonAr'>>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  submitForApproval: (id: string) => Promise<void>;
  approve: (id: string, payload: EmployeeAdvanceDecisionDto) => Promise<void>;
  reject: (id: string, payload: EmployeeAdvanceDecisionDto) => Promise<void>;
};

export const useHREmployeeAdvancesStore = create<State>()((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async (params) => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await employeeAdvancesApi.list({
        companyId,
        employeeId: params?.employeeId,
        status: params?.status,
        advanceDateFrom: params?.advanceDateFrom,
        advanceDateTo: params?.advanceDateTo,
        limit: 200,
      });
      set({
        items: result.items.map((item) =>
          mapEmployeeAdvanceFromApi(item, { catalog: result.approvalAssignments }),
        ),
        isLoading: false,
      });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
      throw e;
    }
  },

  add: async (a) => {
    const companyId = getDefaultCompanyId() ?? '';
    const body = {
      companyId,
      employeeId: a.employeeId,
      amount: a.amount,
      currency: a.currency,
      advanceDate: a.advanceDate,
      note: a.note,
      status: 'pending_approval' as const,
      advanceKind: toBackendKind(a.advanceKind),
      repaymentMode: toBackendRepaymentMode(a.repaymentMode),
      repaymentMonths: a.repaymentMonths ?? undefined,
      monthlyInstallmentAmount: a.monthlyInstallmentAmount ?? undefined,
    };

    let lastError: unknown;
    for (let attempt = 0; attempt < CREATE_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const created = await employeeAdvancesApi.create(body);
        const mapped = mapEmployeeAdvanceFromApi(created);
        set(s => ({ items: [mapped, ...s.items] }));
        return mapped;
      } catch (e) {
        lastError = e;
        const canRetry = isDuplicateAdvanceNumberError(e) && attempt < CREATE_RETRY_ATTEMPTS - 1;
        if (!canRetry) break;
        await new Promise((resolve) => setTimeout(resolve, CREATE_RETRY_DELAY_MS * (attempt + 1)));
      }
    }

    if (isDuplicateAdvanceNumberError(lastError)) {
      throw new Error(duplicateAdvanceNumberMessage());
    }
    throw lastError;
  },

  update: async (id, patch) => {
    const updated = await employeeAdvancesApi.update(id, {
      amount: patch.amount,
      currency: patch.currency,
      advanceDate: patch.advanceDate,
      note: patch.note,
      advanceKind: patch.advanceKind != null ? toBackendKind(patch.advanceKind) : undefined,
      repaymentMode: patch.repaymentMode != null ? toBackendRepaymentMode(patch.repaymentMode) : undefined,
      repaymentMonths: patch.repaymentMonths ?? undefined,
      monthlyInstallmentAmount: patch.monthlyInstallmentAmount ?? undefined,
    });
    set(s => ({ items: s.items.map(row => row.id === id ? mapEmployeeAdvanceFromApi(updated) : row) }));
    return true;
  },

  remove: async (id) => {
    await employeeAdvancesApi.delete(id);
    set(s => ({ items: s.items.filter(row => row.id !== id) }));
    return true;
  },

  submitForApproval: async (id) => {
    const updated = await employeeAdvancesApi.update(id, { status: 'pending_approval' });
    set(s => ({ items: s.items.map(row => row.id === id ? mapEmployeeAdvanceFromApi(updated) : row) }));
  },

  approve: async (id, payload) => {
    const updated = await employeeAdvancesApi.decide(id, payload);
    set(s => ({ items: s.items.map(row => row.id === id ? mapEmployeeAdvanceFromApi(updated) : row) }));
  },

  reject: async (id, payload) => {
    const updated = await employeeAdvancesApi.decide(id, payload);
    set(s => ({ items: s.items.map(row => row.id === id ? mapEmployeeAdvanceFromApi(updated) : row) }));
  },
}));

export const ADVANCE_STATUS_LABELS: Record<HREmployeeAdvanceStatus, string> = {
  draft: AR_STATUS.draft,
  pending_approval: AR_STATUS.pendingApproval,
  approved: AR_STATUS.approvedFormal,
  rejected: AR_STATUS.rejected,
  disbursed: 'مصروف',
  repaying: 'قيد السداد',
  fully_repaid: 'مُسدَّدة',
  cancelled: AR_STATUS.cancelled,
};

export const ADVANCE_STATUS_FILTER_ORDER: HREmployeeAdvanceStatus[] = [
  'pending_approval',
  'approved',
  'rejected',
  'draft',
  'disbursed',
  'repaying',
  'fully_repaid',
  'cancelled',
];

export const ADVANCE_KIND_LABELS: Record<HREmployeeAdvanceKind, string> = {
  housing: 'سكني',
  personal: 'شخصي',
  urgent: 'عاجل',
  violation: 'مخالفة',
};

export const REPAYMENT_MODE_LABELS: Record<HREmployeeAdvanceRepaymentMode, string> = {
  by_months: 'عدد أشهر محدد',
  by_monthly_amount: 'مبلغ شهري محدد',
};

export function advanceReasonText(
  x: Pick<HREmployeeAdvance, 'reasonAr' | 'note'>,
): string {
  return (x.reasonAr || x.note || '').trim();
}
