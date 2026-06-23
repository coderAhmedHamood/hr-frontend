import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type PayrollPeriodStatusDto = 'draft' | 'open' | 'locked' | 'closed' | 'cancelled';

export type PayrollPeriodReviewStageDto = 'first_review' | 'second_review' | 'third_review';

export type PayrollPeriodResponseDto = {
  id: string;
  companyId: string;
  periodYear: number;
  periodMonth: number;
  startDate: string;
  endDate: string;
  payrollDate: string;
  status: PayrollPeriodStatusDto;
  includeAdvances: boolean;
  includeAbsence: boolean;
  includeLateness: boolean;
  includePenalties: boolean;
  includeManualInputs: boolean;
  includeBonuses: boolean;
  includeOvertime: boolean;
  reviewStage: PayrollPeriodReviewStageDto;
  isReviewCompleted: boolean;
  reviewNotes: string | null;
  firstReviewedBy: string | null;
  firstReviewedAt: string | null;
  secondReviewedBy: string | null;
  secondReviewedAt: string | null;
  thirdReviewedBy: string | null;
  thirdReviewedAt: string | null;
  notes: string | null;
  lockedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewPeriodActionDto = {
  reviewedBy?: string | null;
  notes?: string | null;
};

export type PayrollPeriodIncludeFlagsDto = {
  includeAdvances?: boolean;
  includeAbsence?: boolean;
  includeLateness?: boolean;
  includePenalties?: boolean;
  includeManualInputs?: boolean;
  includeBonuses?: boolean;
  includeOvertime?: boolean;
};

export type CreatePayrollPeriodDto = {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  startDate: string;
  endDate: string;
  payrollDate: string;
  status?: PayrollPeriodStatusDto;
  notes?: string;
} & PayrollPeriodIncludeFlagsDto;

export type UpdatePayrollPeriodDto = Partial<Omit<CreatePayrollPeriodDto, 'companyId'>>;

export const payrollPeriodsApi = {
  list: (params?: {
    companyId?: string;
    status?: string;
    periodYear?: number;
    periodMonth?: number;
    page?: number;
    limit?: number;
    archiveScope?: OrganizationArchiveScope;
  }) =>
    apiRequest<PaginatedResult<PayrollPeriodResponseDto>>('/payroll/periods', { query: params }),
  get: (id: string) =>
    apiRequest<PayrollPeriodResponseDto>(`/payroll/periods/${id}`),
  create: (body: CreatePayrollPeriodDto) =>
    apiRequest<PayrollPeriodResponseDto>('/payroll/periods', { method: 'POST', body }),
  update: (id: string, body: UpdatePayrollPeriodDto) =>
    apiRequest<PayrollPeriodResponseDto>(`/payroll/periods/${id}`, { method: 'PATCH', body }),
  delete: (id: string) =>
    apiRequest<void>(`/payroll/periods/${id}`, { method: 'DELETE' }),
  advanceReview: (id: string, body: ReviewPeriodActionDto = {}) =>
    apiRequest<PayrollPeriodResponseDto>(`/payroll/periods/${id}/review/advance`, { method: 'POST', body }),
  revertReview: (id: string, body: ReviewPeriodActionDto = {}) =>
    apiRequest<PayrollPeriodResponseDto>(`/payroll/periods/${id}/review/revert`, { method: 'POST', body }),
};
