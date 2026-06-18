import type { SubmitDisciplineInvestigationResultsDto } from '@/features/hr/discipline/lib/api/discipline-investigations';
import type { InvestigationResultsDraftForm } from '@/features/hr/discipline/investigations/constants/investigation-form';
import {
  createDisciplineInvestigationWithResults,
  submitDisciplineInvestigationResults,
  toInvestigationRecommendationDto,
  toInvestigationResultDto,
} from '@/features/hr/discipline/investigations/services/discipline-investigations.service';

export function validateInvestigationResultsDraft(
  draft: InvestigationResultsDraftForm,
  options?: { requireInvestigationDate?: boolean },
): string | null {
  if (!draft.investigatorEmployeeId.trim()) return 'المحقق مطلوب';
  if (options?.requireInvestigationDate !== false && !draft.investigationDate.trim()) {
    return 'تاريخ التحقيق مطلوب';
  }

  const recommendation = draft.recommendationType === 'all'
    ? null
    : toInvestigationRecommendationDto(draft.recommendationType);

  if (recommendation === 'deduction') {
    const value = Number(draft.deductionValue);
    if (!draft.deductionValue.trim() || Number.isNaN(value)) return 'قيمة الاستقطاع مطلوبة';
  }

  return null;
}

export function buildSubmitInvestigationResultsDto(
  draft: InvestigationResultsDraftForm,
): SubmitDisciplineInvestigationResultsDto {
  const recommendation = draft.recommendationType === 'all'
    ? null
    : toInvestigationRecommendationDto(draft.recommendationType);

  const deductionValue = recommendation === 'deduction'
    ? Number(draft.deductionValue)
    : undefined;

  return {
    investigatorEmployeeId: draft.investigatorEmployeeId,
    employeeStatement: draft.employeeStatement.trim() || null,
    witnessStatement: draft.witnessStatement.trim() || null,
    result: toInvestigationResultDto(draft.result),
    recommendation,
    deductionType: recommendation === 'deduction' ? draft.deductionType : undefined,
    deductionValue: recommendation === 'deduction' ? deductionValue : undefined,
  };
}

export async function submitInvestigationForViolationRecord(input: {
  companyId: string;
  violationRecordId: string;
  pendingInvestigationId: string | null;
  draft: InvestigationResultsDraftForm;
}) {
  const resultsDto = buildSubmitInvestigationResultsDto(input.draft);

  if (input.pendingInvestigationId) {
    return submitDisciplineInvestigationResults(input.pendingInvestigationId, resultsDto);
  }

  return createDisciplineInvestigationWithResults({
    companyId: input.companyId,
    violationRecordId: input.violationRecordId,
    investigatorEmployeeId: input.draft.investigatorEmployeeId,
    investigationDate: input.draft.investigationDate,
    ...resultsDto,
  });
}
