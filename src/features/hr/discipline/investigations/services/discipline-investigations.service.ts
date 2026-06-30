import type {
  HRDisciplineInvestigationRecord,
  HRInvestigationRecommendation,
  HRInvestigationResult,
} from '@/features/hr/discipline/lib/types';
import {
  INVESTIGATION_RECOMMENDATION_LABELS,
  INVESTIGATION_RESULT_LABELS,
  normalizeInvestigationDeductionType,
  formatInvestigationDeductionType,
  formatInvestigationDeductionValue,
} from '@/features/hr/discipline/lib/types';
import { toIso } from '@/features/hr/lib/map-dto';
import {
  disciplineInvestigationsApi,
  type CreateDisciplineInvestigationDto,
  type CreateDisciplineInvestigationWithResultsDto,
  type DisciplineInvestigationResponseDto,
  type InvestigationDeductionTypeDto,
  type InvestigationRecommendationDto,
  type InvestigationResultDto,
  type InvestigationSubmittedResultDto,
  type SubmitDisciplineInvestigationResultsDto,
  type UpdateDisciplineInvestigationDto,
} from '@/features/hr/discipline/lib/api/discipline-investigations';

const DEDUCTION_TYPE_LABELS: Record<InvestigationDeductionTypeDto, string> = {
  days: 'أيام',
  hours: 'ساعات',
  fixed_amount: 'مبلغ ثابت',
};

function parseDeductionValue(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  return Number.isNaN(n) ? null : n;
}

export function mapInvestigationResult(
  result: InvestigationResultDto,
): HRInvestigationResult {
  if (result === 'pending') return 'pending';
  return result;
}

export function toInvestigationResultDto(
  result: HRInvestigationResult,
): InvestigationSubmittedResultDto {
  if (result === 'pending') {
    throw new Error('Cannot submit investigation results with pending result');
  }
  return result;
}

export function toInvestigationRecommendationDto(
  recommendation: HRInvestigationRecommendation,
): InvestigationRecommendationDto {
  return recommendation;
}

function buildRecommendationText(dto: DisciplineInvestigationResponseDto): string {
  if (dto.recommendation === 'warning') {
    return INVESTIGATION_RECOMMENDATION_LABELS.warning;
  }
  if (dto.recommendation === 'deduction') {
    const normalizedType = normalizeInvestigationDeductionType(dto.deductionType);
    const label = normalizedType
      ? DEDUCTION_TYPE_LABELS[normalizedType]
      : formatInvestigationDeductionType(dto.deductionType) ?? INVESTIGATION_RECOMMENDATION_LABELS.deduction;
    const value = parseDeductionValue(dto.deductionValue);
    return value != null ? `${label}: ${formatInvestigationDeductionValue(value)}` : label;
  }
  return INVESTIGATION_RESULT_LABELS[mapInvestigationResult(dto.result)];
}

export function mapDisciplineInvestigationResponse(
  dto: DisciplineInvestigationResponseDto,
  employeeNameById: Record<string, string>,
): HRDisciplineInvestigationRecord {
  const employeeNameAr = employeeNameById[dto.subjectEmployeeId] ?? dto.subjectEmployeeId;
  const investigatorName = dto.investigatorEmployeeId
    ? (employeeNameById[dto.investigatorEmployeeId] ?? dto.investigatorEmployeeId)
    : '—';

  return {
    id: dto.id,
    caseId: dto.violationRecordId,
    caseNumber: dto.linkedViolationRecordNumber,
    employeeId: dto.subjectEmployeeId,
    employeeNameAr,
    investigatorEmployeeId: dto.investigatorEmployeeId,
    investigatorName,
    date: dto.investigationDate,
    employeeStatement: dto.employeeStatement ?? '',
    witnessStatement: dto.witnessStatement ?? '',
    result: mapInvestigationResult(dto.result),
    recommendation: buildRecommendationText(dto),
    recommendationType: (dto.recommendation ?? null) as HRInvestigationRecommendation | null,
    deductionType: normalizeInvestigationDeductionType(dto.deductionType),
    deductionValue: parseDeductionValue(dto.deductionValue),
    createdAt: toIso(dto.createdAt),
    updatedAt: toIso(dto.updatedAt),
  };
}

export async function createDisciplineInvestigation(
  payload: CreateDisciplineInvestigationDto,
) {
  return disciplineInvestigationsApi.create(payload);
}

export async function openDisciplineInvestigation(
  payload: Omit<CreateDisciplineInvestigationDto, 'result' | 'employeeStatement' | 'witnessStatement' | 'recommendation' | 'deductionType' | 'deductionValue'>,
) {
  return disciplineInvestigationsApi.create({
    ...payload,
    result: 'pending',
    employeeStatement: null,
    witnessStatement: null,
    recommendation: null,
  });
}

export async function submitDisciplineInvestigationResults(
  id: string,
  payload: SubmitDisciplineInvestigationResultsDto,
) {
  return disciplineInvestigationsApi.submitResults(id, payload);
}

export async function createDisciplineInvestigationWithResults(
  input: CreateDisciplineInvestigationWithResultsDto,
) {
  const {
    companyId,
    violationRecordId,
    linkedViolationRecordNumber,
    investigatorEmployeeId,
    investigationDate,
    createdBy,
    employeeStatement,
    witnessStatement,
    result,
    recommendation,
    deductionType,
    deductionValue,
    updatedBy,
  } = input;

  const created = await disciplineInvestigationsApi.create({
    companyId,
    violationRecordId,
    linkedViolationRecordNumber,
    investigatorEmployeeId,
    investigationDate,
    createdBy,
    result: 'pending',
    employeeStatement: null,
    witnessStatement: null,
    recommendation: null,
  });

  return disciplineInvestigationsApi.submitResults(created.id, {
    ...(investigatorEmployeeId ? { investigatorEmployeeId } : {}),
    employeeStatement,
    witnessStatement,
    result,
    recommendation,
    deductionType,
    deductionValue,
    updatedBy,
  });
}

export async function updateDisciplineInvestigation(
  id: string,
  payload: UpdateDisciplineInvestigationDto,
) {
  return disciplineInvestigationsApi.update(id, payload);
}

export async function deleteDisciplineInvestigation(id: string) {
  return disciplineInvestigationsApi.remove(id);
}

export function isFinalInvestigationResult(result: HRInvestigationResult) {
  return result === 'proven' || result === 'not_proven';
}

export function canMutateInvestigationRecord(result: HRInvestigationResult) {
  return !isFinalInvestigationResult(result);
}
