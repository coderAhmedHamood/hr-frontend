import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type InvestigationResultDto = 'pending' | 'proven' | 'not_proven';
export type InvestigationSubmittedResultDto = 'proven' | 'not_proven';
export type InvestigationRecommendationDto = 'warning' | 'deduction';
export type InvestigationDeductionTypeDto = 'days' | 'hours' | 'fixed_amount';

export type DisciplineInvestigationResponseDto = {
  id: string;
  companyId: string;
  violationRecordId: string;
  linkedViolationRecordNumber: string;
  subjectEmployeeId: string;
  investigatorEmployeeId: string | null;
  investigationDate: string;
  employeeStatement: string | null;
  witnessStatement: string | null;
  result: InvestigationResultDto;
  recommendation: InvestigationRecommendationDto | null;
  deductionType: InvestigationDeductionTypeDto | null;
  deductionValue: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

/** Opens an investigation record linked to a violation case. */
export type CreateDisciplineInvestigationDto = {
  companyId: string;
  violationRecordId?: string;
  linkedViolationRecordNumber?: string;
  investigatorEmployeeId: string;
  investigationDate: string;
  employeeStatement?: string | null;
  witnessStatement?: string | null;
  result: InvestigationResultDto;
  recommendation?: InvestigationRecommendationDto | null;
  deductionType?: InvestigationDeductionTypeDto;
  deductionValue?: number;
  createdBy?: string | null;
};

/** POST /discipline/investigations/{id}/results — submit findings on an existing record. */
export type SubmitDisciplineInvestigationResultsDto = {
  investigatorEmployeeId?: string;
  employeeStatement?: string | null;
  witnessStatement?: string | null;
  result: InvestigationSubmittedResultDto;
  recommendation?: InvestigationRecommendationDto | null;
  deductionType?: InvestigationDeductionTypeDto;
  deductionValue?: number;
  updatedBy?: string | null;
};

export type CreateDisciplineInvestigationWithResultsDto = CreateDisciplineInvestigationDto &
  SubmitDisciplineInvestigationResultsDto;

export type UpdateDisciplineInvestigationDto = {
  investigatorEmployeeId?: string;
  investigationDate?: string;
  updatedBy?: string | null;
};

export type DisciplineInvestigationListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  violationRecordId?: string;
  subjectEmployeeId?: string;
  investigatorEmployeeId?: string;
  result?: InvestigationResultDto;
};

export const disciplineInvestigationsApi = {
  getAll(query?: DisciplineInvestigationListQuery) {
    return apiRequest<PaginatedResult<DisciplineInvestigationResponseDto>>('/discipline/investigations', { query });
  },
  getById(id: string) {
    return apiRequest<DisciplineInvestigationResponseDto>(`/discipline/investigations/${id}`);
  },
  create(payload: CreateDisciplineInvestigationDto) {
    return apiRequest<DisciplineInvestigationResponseDto>('/discipline/investigations', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateDisciplineInvestigationDto) {
    return apiRequest<DisciplineInvestigationResponseDto>(`/discipline/investigations/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  submitResults(id: string, payload: SubmitDisciplineInvestigationResultsDto) {
    return apiRequest<DisciplineInvestigationResponseDto>(`/discipline/investigations/${id}/results`, {
      method: 'POST',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/investigations/${id}`, { method: 'DELETE' });
  },
};
