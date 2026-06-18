import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ViolationRecordStatus = 'pending' | 'approved' | 'rejected' | 'needs_edit';

export type ViolationTypeSummaryDto = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  hasDeduction: boolean;
  deductionKind: 'amount' | 'hours' | 'day' | 'days' | 'none' | null;
  deductionValue: string | null;
  needsWarning: boolean;
  needsInvestigation: boolean;
  needsApproval: boolean;
};

export type ViolationInvestigationDto = {
  id: string;
  violationRecordId: string;
  linkedViolationRecordNumber: string | null;
  subjectEmployeeId: string;
  investigatorEmployeeId: string | null;
  investigationDate: string;
  employeeStatement: string | null;
  witnessStatement: string | null;
  result: 'pending' | 'proven' | 'not_proven';
  recommendation: 'warning' | 'deduction' | null;
  deductionType: 'days' | 'hours' | 'fixed_amount' | null;
  deductionValue: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ViolationRecordResponseDto = {
  id: string;
  companyId: string;
  recordNumber: string;
  employeeId: string;
  violationTypeId: string;
  violationType?: ViolationTypeSummaryDto | null;
  violationTypeNeedsInvestigation?: boolean;
  hasInvestigations?: boolean;
  status: ViolationRecordStatus;
  violationDate: string;
  description: string;
  notes: string | null;
  attachmentsNote: string | null;
  decisionNotes?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
  investigations?: ViolationInvestigationDto[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type UpdateViolationRecordDto = {
  violationDate?: string;
  description?: string;
  notes?: string | null;
  attachmentsNote?: string | null;
  updatedBy?: string | null;
};

export type DecideViolationRecordDto = {
  decision: 'approve' | 'reject';
  notes?: string | null;
  decidedBy?: string | null;
};

export type ViolationRecordListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  violationTypeId?: string;
  violationDateFrom?: string;
  violationDateTo?: string;
};

export type CreateViolationRecordDto = {
  companyId: string;
  employeeId: string;
  violationTypeId: string;
  violationDate: string;
  description: string;
  notes?: string | null;
  attachmentsNote?: string | null;
  createdBy?: string | null;
};

export type PushViolationsToPayrollDto = {
  payrollPeriodId: string;
  employeeIds?: string[];
  replaceExisting?: boolean;
  createdBy?: string | null;
};

export type PushViolationsToPayrollResponseDto = {
  payrollPeriodId: string;
  inputsCreated: number;
  inputsDeleted: number;
  violationsProcessed: number;
  violationsSkipped: number;
  totalDeducted: string;
  items: Array<{
    violationRecordId: string;
    recordNumber: string;
    employeeId: string;
    employeeNameAr: string;
    source: 'investigation' | 'violation_type';
    basis: 'days' | 'hours' | 'fixed';
    basisValue: string;
    amount: string;
    skippedReason: string | null;
  }>;
};

export const violationRecordsApi = {
  getAll(query?: ViolationRecordListQuery) {
    return apiRequest<PaginatedResult<ViolationRecordResponseDto>>('/discipline/violation-records', { query });
  },
  getById(id: string) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}`);
  },
  create(payload: CreateViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>('/discipline/violation-records', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}`, { method: 'PATCH', body: payload });
  },
  decide(id: string, payload: DecideViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}/decision`, {
      method: 'POST',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/violation-records/${id}`, { method: 'DELETE' });
  },

  pushToPayroll: (body: PushViolationsToPayrollDto) =>
    apiRequest<PushViolationsToPayrollResponseDto>('/discipline/violation-records/push-to-payroll', {
      method: 'POST',
      body,
    }),
};
