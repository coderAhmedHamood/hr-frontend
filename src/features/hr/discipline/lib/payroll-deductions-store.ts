import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { disciplinePayrollDeductionsApi } from './api/discipline-payroll-deductions';
import type { DisciplinePayrollDeductionResponseDto, PayrollDeductionTypeDto, PayrollDeductionStatusDto } from './api/discipline-payroll-deductions';
import type { HRDisciplinePayrollDeductionRecord, HRViolationDeductionKind, HRDeductionStatus } from './types';

function mapDeductionType(t: PayrollDeductionTypeDto): HRViolationDeductionKind {
  switch (t) {
    case 'fixed_amount': return 'amount';
    case 'days': return 'day';
    case 'hours': return 'hours';
  }
}

function mapDeductionStatus(s: PayrollDeductionStatusDto): HRDeductionStatus {
  switch (s) {
    case 'pending': return 'ready';
    case 'sent_to_payroll': return 'posted';
    case 'applied': return 'calculated';
    case 'cancelled': return 'cancelled';
  }
}

function mapDeductionKindToBackend(k: HRViolationDeductionKind): PayrollDeductionTypeDto {
  switch (k) {
    case 'amount': return 'fixed_amount';
    case 'day': return 'days';
    case 'hours': return 'hours';
    default: return 'fixed_amount';
  }
}

function mapStatusToBackend(s: HRDeductionStatus): PayrollDeductionStatusDto {
  switch (s) {
    case 'ready': return 'pending';
    case 'posted': return 'sent_to_payroll';
    case 'calculated': return 'applied';
    case 'cancelled': return 'cancelled';
  }
}

function mapApi(r: DisciplinePayrollDeductionResponseDto): HRDisciplinePayrollDeductionRecord {
  const deductionKind = mapDeductionType(r.deductionType);
  let amount = 0;
  if (r.amount != null) amount = parseFloat(r.amount);
  else if (r.daysCount != null) amount = parseFloat(r.daysCount);
  else if (r.hoursCount != null) amount = parseFloat(r.hoursCount);

  return {
    id: r.id,
    caseId: r.violationRecordId,
    caseNumber: r.linkedViolationRecordNumber,
    employeeId: r.employeeId,
    employeeNameAr: '',
    reasonAr: r.reasonAr ?? '',
    deductionKind,
    amount,
    month: r.payrollPeriod,
    status: mapDeductionStatus(r.status),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

interface DedState {
  deductions: HRDisciplinePayrollDeductionRecord[];
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (d: Omit<HRDisciplinePayrollDeductionRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, patch: Partial<HRDisciplinePayrollDeductionRecord>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useHRDisciplinePayrollDeductionsStore = create<DedState>()((set) => ({
  deductions: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await disciplinePayrollDeductionsApi.getAll({ companyId, limit: 200 });
      set({ deductions: result.items.map(mapApi), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  add: async (d) => {
    const companyId = getDefaultCompanyId() ?? '';
    const backendType = mapDeductionKindToBackend(d.deductionKind);
    const created = await disciplinePayrollDeductionsApi.create({
      companyId,
      employeeId: d.employeeId,
      violationRecordId: d.caseId || undefined,
      payrollPeriod: d.month,
      deductionType: backendType,
      ...(backendType === 'fixed_amount' ? { amount: d.amount } : {}),
      ...(backendType === 'days' ? { daysCount: d.amount } : {}),
      ...(backendType === 'hours' ? { hoursCount: d.amount } : {}),
      reasonAr: d.reasonAr || null,
      status: mapStatusToBackend(d.status),
    });
    set((s) => ({ deductions: [...s.deductions, mapApi(created)] }));
  },

  update: async (id, patch) => {
    const backendType = patch.deductionKind ? mapDeductionKindToBackend(patch.deductionKind) : undefined;
    const updated = await disciplinePayrollDeductionsApi.update(id, {
      ...(patch.month != null ? { payrollPeriod: patch.month } : {}),
      ...(backendType != null ? { deductionType: backendType } : {}),
      ...(patch.amount != null && backendType === 'fixed_amount' ? { amount: patch.amount } : {}),
      ...(patch.amount != null && backendType === 'days' ? { daysCount: patch.amount } : {}),
      ...(patch.amount != null && backendType === 'hours' ? { hoursCount: patch.amount } : {}),
      ...(patch.status != null ? { status: mapStatusToBackend(patch.status) } : {}),
      ...(patch.reasonAr != null ? { reasonAr: patch.reasonAr } : {}),
    });
    set((s) => ({ deductions: s.deductions.map((d) => (d.id === id ? mapApi(updated) : d)) }));
  },

  remove: async (id) => {
    await disciplinePayrollDeductionsApi.remove(id);
    set((s) => ({ deductions: s.deductions.filter((d) => d.id !== id) }));
  },
}));
