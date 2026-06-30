import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { AR_STATUS } from '@/shared/i18n/ar';

export type PayslipStatusDto = 'draft' | 'approved' | 'paid';

export type PayslipAcceptanceStatusDto = 'pending' | 'accepted' | 'rejected';

export type PayslipResponseDto = {
  id: string;
  companyId: string;
  payrollPeriodId: string;
  periodYear: number | null;
  periodMonth: number | null;
  employeeId: string;
  employeeNameAr: string;
  contractId: string | null;
  contractNumber: string | null;
  baseSalary: string;
  allowancesTotal: string;
  additionsTotal: string;
  deductionsTotal: string;
  gosi: string;
  gross: string;
  net: string;
  currency: string;
  workingDays: number | null;
  presentDays: number | null;
  absentDays: number | null;
  lateDays: number | null;
  breakdown: Record<string, unknown> | null;
  generatedAt: string | null;
  status: PayslipStatusDto;
  acceptanceStatus: PayslipAcceptanceStatusDto;
  acceptanceAt: string | null;
  acceptanceNote: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type GeneratePayslipsDto = {
  payrollPeriodId: string;
  employeeIds?: string[];
  replaceExisting?: boolean;
  generatedBy?: string | null;
};

export type FinalizePeriodPayslipsDto = {
  payrollPeriodId: string;
  employeeIds?: string[];
  replaceExisting?: boolean;
  finalizedBy?: string | null;
};

export type FinalizePeriodPayslipsResponseDto = {
  payrollPeriodId: string;
  periodStatus: string;
  lockedAt: string | null;
  generatedCount: number;
  approvedCount: number;
  paidCount: number;
  totalPayslips: number;
  payslips: PayslipResponseDto[];
};

export type UpdatePayslipDto = {
  status?: PayslipStatusDto;
  notes?: string | null;
  updatedBy?: string | null;
};

export type PayslipEmployeeDecisionDto = {
  employeeId: string;
  decision: Exclude<PayslipAcceptanceStatusDto, 'pending'>;
  note?: string | null;
};

export type PayslipDecisionChannel = 'dashboard' | 'mobile';

export function buildPayslipDecisionNote(
  decision: Exclude<PayslipAcceptanceStatusDto, 'pending'>,
  options: {
    channel: PayslipDecisionChannel;
    actorName: string;
    actorEmail?: string | null;
    extraNote?: string | null;
  },
): string {
  const verb = decision === 'accepted' ? 'تمت الموافقة' : 'تم الرفض';
  const channelLabel = options.channel === 'dashboard' ? 'لوحة التحكم' : 'تطبيق الموظف';
  const name = options.actorName.trim() || '—';
  const contact = options.actorEmail?.trim() ? ` (${options.actorEmail.trim()})` : '';
  let note = `${verb} عبر ${channelLabel} — ${name}${contact}`;
  if (options.extraNote?.trim()) {
    note += `\n${options.extraNote.trim()}`;
  }
  return note;
}

export function canSubmitPayslipEmployeeDecision(
  row: Pick<PayslipResponseDto, 'status' | 'acceptanceStatus'>,
): boolean {
  return row.status !== 'paid' && payslipAcceptanceStatus(row) === 'pending';
}

export const PAYSLIP_STATUS_LABELS: Record<PayslipStatusDto, string> = {
  draft: AR_STATUS.draft,
  approved: 'معتمدة',
  paid: 'مدفوعة',
};

export const PAYSLIP_STATUS_COLORS: Record<PayslipStatusDto, string> = {
  draft: 'text-muted-foreground border-border bg-muted/40',
  approved: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  paid: 'text-primary border-primary/25 bg-primary/10',
};

/** Employee acceptance of payslip dues (موافقة الموظف على صرف المستحقات). */
export const PAYSLIP_ACCEPTANCE_STATUS_LABELS: Record<PayslipAcceptanceStatusDto, string> = {
  pending: 'بانتظار اعتماد الموظف',
  accepted: 'اعتمد الموظف',
  rejected: AR_STATUS.rejected,
};

export const PAYSLIP_ACCEPTANCE_STATUS_COLORS: Record<PayslipAcceptanceStatusDto, string> = {
  pending: 'text-amber-800 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-950/30',
  accepted: 'text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30',
  rejected: 'text-destructive border-destructive/25 bg-destructive/10',
};

export const PAYSLIP_BREAKDOWN_TOTAL_LABELS: Record<string, string> = {
  baseSalary: 'الراتب الأساسي',
  allowancesTotal: 'إجمالي البدلات',
  additionsTotal: 'إجمالي الإضافات',
  deductionsTotal: 'إجمالي الخصومات',
  gosi: 'التأمينات',
  gross: 'الإجمالي',
  net: 'الصافي',
};

export const PAYSLIP_ATTENDANCE_LABELS: Record<string, string> = {
  workingDays: 'أيام العمل',
  presentDays: 'أيام الحضور',
  absentDays: 'أيام الغياب',
  lateDays: 'أيام التأخير',
};

export function payslipAcceptanceStatus(
  row: Pick<PayslipResponseDto, 'acceptanceStatus'>,
): PayslipAcceptanceStatusDto {
  return row.acceptanceStatus ?? 'pending';
}

export function parsePayslipMoney(value: string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export const payslipsApi = {
  list: (params?: {
    companyId?: string;
    payrollPeriodId?: string;
    employeeId?: string;
    status?: PayslipStatusDto;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<PayslipResponseDto>>('/payroll/payslips', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<PayslipResponseDto>(`/payroll/payslips/${id}`),

  generate: (body: GeneratePayslipsDto) =>
    apiRequest<PayslipResponseDto[]>('/payroll/payslips/generate', { method: 'POST', body }),

  finalize: (body: FinalizePeriodPayslipsDto) =>
    apiRequest<FinalizePeriodPayslipsResponseDto>('/payroll/payslips/finalize', { method: 'POST', body }),

  update: (id: string, body: UpdatePayslipDto) =>
    apiRequest<PayslipResponseDto>(`/payroll/payslips/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiRequest<void>(`/payroll/payslips/${id}`, { method: 'DELETE' }),

  employeeDecision: (id: string, body: PayslipEmployeeDecisionDto) =>
    apiRequest<PayslipResponseDto>(`/payroll/payslips/${id}/employee-decision`, {
      method: 'POST',
      body,
    }),
};
