import { apiRequest, ApiError, type PaginatedResult } from '@/features/hr/lib/api/client';
import { toRequestDecisionApiBody } from '@/features/hr/requests/lib/request-approver-states';
import type { RequestApproverStatesSnapshot } from '@/features/hr/requests/lib/api/request-approver-states-types';
import type {
  RequestApprovalAssignmentCatalogDto,
  RequestApproverDecisionOverlayDto,
} from '@/features/hr/requests/types/api/overtime-requests';

export type AdvanceStatusDto = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'disbursed' | 'repaying' | 'fully_repaid' | 'cancelled';
export type AdvanceKindDto = 'salary_advance' | 'emergency' | 'travel' | 'housing' | 'other';
export type RepaymentModeDto = 'monthly_payroll' | 'lump_sum' | 'flexible';

export type EmployeeAdvanceResponseDto = {
  id: string;
  companyId: string;
  branchId: string | null;
  branchNameAr: string | null;
  employeeId: string;
  employeeNameAr: string;
  advanceNumber: string;
  amount: string;
  currency: string;
  advanceDate: string;
  note: string | null;
  reasonAr: string | null;
  status: AdvanceStatusDto;
  advanceKind: AdvanceKindDto | null;
  repaymentMode: RepaymentModeDto | null;
  repaymentMonths: number | null;
  monthlyInstallmentAmount: string | null;
  totalRepaidAmount: string;
  remainingAmount: string;
  approvedAt: string | null;
  rejectedAt?: string | null;
  decisionNotes?: string | null;
  decidedBy?: string | null;
  decidedByEmployeeId?: string | null;
  approverStates?: RequestApproverStatesSnapshot | null;
  approver_states?: RequestApproverStatesSnapshot | null;
  approvalAssignment?: {
    id: string;
    approvalMode: 'sequential' | 'parallel';
    approvers: Array<{
      employeeId: string;
      employeeNameAr: string;
      sortOrder: number;
      status: 'pending' | 'approved' | 'rejected' | 'cancelled';
      decidedAt: string | null;
      notes: string | null;
    }>;
  } | null;
  disbursedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeAdvanceListItemDto = Omit<EmployeeAdvanceResponseDto, 'approvalAssignment'> & {
  approvalAssignmentId: string | null;
  approverDecisions: RequestApproverDecisionOverlayDto[] | null;
};

export type EmployeeAdvanceListResponseDto = {
  items: EmployeeAdvanceListItemDto[];
  approvalAssignments: RequestApprovalAssignmentCatalogDto[];
  pagination: PaginatedResult<EmployeeAdvanceListItemDto>['pagination'];
};

export type CreateEmployeeAdvanceDto = {
  companyId: string;
  employeeId: string;
  amount: number;
  currency?: string;
  advanceDate: string;
  note?: string;
  status?: AdvanceStatusDto;
  advanceKind?: AdvanceKindDto;
  repaymentMode?: RepaymentModeDto;
  repaymentMonths?: number;
  monthlyInstallmentAmount?: number;
};

export type UpdateEmployeeAdvanceDto = Partial<Omit<CreateEmployeeAdvanceDto, 'companyId' | 'employeeId'>>;

export type EmployeeAdvanceDecisionDto = {
  decision: 'approve' | 'reject';
  approver_states?: RequestApproverStatesSnapshot;
  approverStates?: RequestApproverStatesSnapshot;
  approverEmployeeId?: string;
  notes?: string;
  decidedBy?: string;
};

export type PushAdvancesToPayrollDto = {
  payrollPeriodId: string;
  employeeIds?: string[];
  replaceExisting?: boolean;
  includeApproved?: boolean;
  createdBy?: string | null;
};

export type PushAdvancesToPayrollResponseDto = {
  payrollPeriodId: string;
  inputsCreated: number;
  inputsDeleted: number;
  advancesProcessed: number;
  advancesFullyRepaid: number;
  advancesSkipped: number;
  totalDeducted: string;
  items: Array<{
    advanceId: string;
    advanceNumber: string;
    employeeId: string;
    employeeNameAr: string | null;
    amount: string;
    monthlyInstallmentAmount: string;
    alreadyRepaid: string;
    remaining: string;
    installmentDue: string;
    alreadyPostedThisPeriod: boolean;
    status: string;
  }>;
};

export type AdvanceInstallmentPreviewItemDto = {
  advanceId: string;
  advanceNumber: string;
  employeeId: string;
  employeeNameAr: string;
  amount: string;
  monthlyInstallmentAmount: string | null;
  alreadyRepaid: string;
  remaining: string;
  installmentDue: string;
  alreadyPostedThisPeriod: boolean;
  status: string;
};

export type AdvanceInstallmentsPreviewResponseDto = {
  payrollPeriodId: string;
  periodYear: number;
  periodMonth: number;
  advancesCount: number;
  totalInstallmentDue: string;
  items: AdvanceInstallmentPreviewItemDto[];
};

export const employeeAdvancesApi = {
  list: (params?: { companyId?: string; employeeId?: string; status?: string; advanceDateFrom?: string; advanceDateTo?: string; page?: number; limit?: number }) =>
    apiRequest<EmployeeAdvanceListResponseDto>('/payroll/employee-advances', { query: params }),
  get: (id: string) =>
    apiRequest<EmployeeAdvanceResponseDto>(`/payroll/employee-advances/${id}`),
  create: (body: CreateEmployeeAdvanceDto) =>
    apiRequest<EmployeeAdvanceResponseDto>('/payroll/employee-advances', { method: 'POST', body }),
  update: (id: string, body: UpdateEmployeeAdvanceDto) =>
    apiRequest<EmployeeAdvanceResponseDto>(`/payroll/employee-advances/${id}`, { method: 'PATCH', body }),
  decide: async (id: string, body: EmployeeAdvanceDecisionDto) => {
    const path = `/payroll/employee-advances/${id}/decision`;
    const apiBody = toRequestDecisionApiBody(body);
    try {
      return await apiRequest<EmployeeAdvanceResponseDto>(path, { method: 'PATCH', body: apiBody });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return apiRequest<EmployeeAdvanceResponseDto>(path, { method: 'POST', body: apiBody });
      }
      throw err;
    }
  },
  delete: (id: string) =>
    apiRequest<void>(`/payroll/employee-advances/${id}`, { method: 'DELETE' }),

  pushToPayroll: (body: PushAdvancesToPayrollDto) =>
    apiRequest<PushAdvancesToPayrollResponseDto>('/payroll/employee-advances/push-to-payroll', {
      method: 'POST',
      body,
    }),

  previewInstallments: (body: Pick<PushAdvancesToPayrollDto, 'payrollPeriodId' | 'employeeIds' | 'includeApproved'>) =>
    apiRequest<AdvanceInstallmentsPreviewResponseDto>('/payroll/employee-advances/installments/preview', {
      method: 'POST',
      body,
    }),
};
