import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  employeeAdvancesApi,
  type EmployeeAdvanceResponseDto,
  type AdvanceKindDto,
  type AdvanceStatusDto,
  type RepaymentModeDto,
} from './api/employee-advances';
import {
  duplicateAdvanceNumberMessage,
  isDuplicateAdvanceNumberError,
} from './employee-advance-errors';

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
  amount: number;
  currency: string;
  advanceDate: string;
  note: string;
  status: HREmployeeAdvanceStatus;
  advanceKind: HREmployeeAdvanceKind;
  repaymentMode: HREmployeeAdvanceRepaymentMode;
  repaymentMonths: number | null;
  monthlyInstallmentAmount: number | null;
  approvedAt: string | null;
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

function mapKind(k: AdvanceKindDto | null): HREmployeeAdvanceKind {
  if (k === 'housing') return 'housing';
  if (k === 'emergency') return 'urgent';
  return 'personal';
}

function mapRepaymentMode(m: RepaymentModeDto | null): HREmployeeAdvanceRepaymentMode {
  if (m === 'monthly_payroll') return 'by_months';
  return 'by_monthly_amount';
}

function mapApi(r: EmployeeAdvanceResponseDto): HREmployeeAdvance {
  return {
    id: r.id,
    advanceNumber: r.advanceNumber,
    employeeId: r.employeeId,
    employeeNameAr: r.employeeNameAr,
    amount: parseFloat(r.amount) || 0,
    currency: r.currency,
    advanceDate: r.advanceDate,
    note: r.note ?? '',
    status: r.status,
    advanceKind: mapKind(r.advanceKind),
    repaymentMode: mapRepaymentMode(r.repaymentMode),
    repaymentMonths: r.repaymentMonths ?? null,
    monthlyInstallmentAmount: r.monthlyInstallmentAmount != null
      ? parseFloat(r.monthlyInstallmentAmount)
      : null,
    approvedAt: r.approvedAt,
    updatedAt: r.updatedAt,
  };
}

function toBackendKind(k: HREmployeeAdvanceKind): AdvanceKindDto {
  if (k === 'housing') return 'housing';
  if (k === 'urgent') return 'emergency';
  return 'salary_advance';
}

function toBackendRepaymentMode(m: HREmployeeAdvanceRepaymentMode): RepaymentModeDto {
  if (m === 'by_months') return 'monthly_payroll';
  return 'flexible';
}

type State = {
  items: HREmployeeAdvance[];
  isLoading: boolean;
  error: string | null;
  fetch: (params?: { employeeId?: string; status?: HREmployeeAdvanceStatus; advanceDateFrom?: string; advanceDateTo?: string }) => Promise<void>;
  add: (a: Omit<HREmployeeAdvance, 'id' | 'advanceNumber' | 'approvedAt' | 'updatedAt' | 'status'>) => Promise<HREmployeeAdvance>;
  update: (id: string, patch: Partial<Omit<HREmployeeAdvance, 'id' | 'advanceNumber' | 'approvedAt' | 'updatedAt'>>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  submitForApproval: (id: string) => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
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
      set({ items: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
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
        const mapped = mapApi(created);
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
    set(s => ({ items: s.items.map(row => row.id === id ? mapApi(updated) : row) }));
    return true;
  },

  remove: async (id) => {
    await employeeAdvancesApi.delete(id);
    set(s => ({ items: s.items.filter(row => row.id !== id) }));
    return true;
  },

  submitForApproval: async (id) => {
    const updated = await employeeAdvancesApi.update(id, { status: 'pending_approval' });
    set(s => ({ items: s.items.map(row => row.id === id ? mapApi(updated) : row) }));
  },

  approve: async (id) => {
    const updated = await employeeAdvancesApi.update(id, { status: 'approved' });
    set(s => ({ items: s.items.map(row => row.id === id ? mapApi(updated) : row) }));
  },

  reject: async (id) => {
    const updated = await employeeAdvancesApi.update(id, { status: 'rejected' });
    set(s => ({ items: s.items.map(row => row.id === id ? mapApi(updated) : row) }));
  },
}));

export const ADVANCE_STATUS_LABELS: Record<HREmployeeAdvanceStatus, string> = {
  draft: 'مسودة',
  pending_approval: 'قيد الموافقة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  disbursed: 'مصروف',
  repaying: 'قيد السداد',
  fully_repaid: 'مُسدَّدة',
  cancelled: 'ملغاة',
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
