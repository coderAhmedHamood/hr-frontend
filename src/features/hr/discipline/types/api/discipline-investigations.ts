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
