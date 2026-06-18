import type { HRDisciplinePayrollDeductionRecord } from '@/features/hr/discipline/lib/types';
import { toIso } from '@/features/hr/lib/map-dto';
import {
  disciplinePayrollDeductionsApi,
  type CreateDisciplinePayrollDeductionDto,
  type DisciplinePayrollDeductionResponseDto,
  type PayrollDeductionStatusDto,
  type PayrollDeductionTypeDto,
  type UpdateDisciplinePayrollDeductionDto,
} from '@/features/hr/discipline/lib/api/discipline-payroll-deductions';

const DEDUCTION_TYPE_LABELS: Record<PayrollDeductionTypeDto, string> = {
  fixed_amount: 'مبلغ ثابت',
  days: 'بالأيام',
  hours: 'بالساعات',
};

const STATUS_LABELS: Record<PayrollDeductionStatusDto, string> = {
  pending: 'جاهز',
  sent_to_payroll: 'مُدرَج',
  applied: 'محسوب',
  cancelled: 'ملغى',
};

export function mapPayrollDeductionType(
  dtoType: PayrollDeductionTypeDto,
): Exclude<HRDisciplinePayrollDeductionRecord['deductionKind'], 'none'> {
  switch (dtoType) {
    case 'fixed_amount': return 'amount';
    case 'days': return 'day';
    case 'hours': return 'hours';
  }
}

export function toPayrollDeductionTypeDto(
  kind: Exclude<HRDisciplinePayrollDeductionRecord['deductionKind'], 'none'>,
): PayrollDeductionTypeDto {
  switch (kind) {
    case 'amount': return 'fixed_amount';
    case 'day': return 'days';
    case 'hours': return 'hours';
  }
}

export function mapPayrollDeductionStatus(
  dtoStatus: PayrollDeductionStatusDto,
): HRDisciplinePayrollDeductionRecord['status'] {
  switch (dtoStatus) {
    case 'pending': return 'ready';
    case 'sent_to_payroll': return 'posted';
    case 'applied': return 'calculated';
    case 'cancelled': return 'cancelled';
  }
}

export function toPayrollDeductionStatusDto(
  status: HRDisciplinePayrollDeductionRecord['status'],
): PayrollDeductionStatusDto {
  switch (status) {
    case 'ready': return 'pending';
    case 'posted': return 'sent_to_payroll';
    case 'calculated': return 'applied';
    case 'cancelled': return 'cancelled';
  }
}

export function mapPayrollDeductionAmount(
  dto: DisciplinePayrollDeductionResponseDto,
): number {
  switch (dto.deductionType) {
    case 'fixed_amount':
      return dto.amount ? Number(dto.amount) : 0;
    case 'days':
      return dto.daysCount ? Number(dto.daysCount) : 0;
    case 'hours':
      return dto.hoursCount ? Number(dto.hoursCount) : 0;
  }
}

export function mapDisciplinePayrollDeductionResponse(
  dto: DisciplinePayrollDeductionResponseDto,
  employeeNameById: Record<string, string>,
): HRDisciplinePayrollDeductionRecord {
  return {
    id: dto.id,
    caseId: dto.violationRecordId,
    caseNumber: dto.linkedViolationRecordNumber,
    employeeId: dto.employeeId,
    employeeNameAr: employeeNameById[dto.employeeId] ?? dto.employeeId,
    reasonAr: dto.reasonAr ?? '',
    deductionKind: mapPayrollDeductionType(dto.deductionType),
    amount: mapPayrollDeductionAmount(dto),
    month: dto.payrollPeriod,
    status: mapPayrollDeductionStatus(dto.status),
    createdAt: toIso(dto.createdAt),
    updatedAt: toIso(dto.updatedAt),
  };
}

export async function createDisciplinePayrollDeduction(
  payload: CreateDisciplinePayrollDeductionDto,
) {
  return disciplinePayrollDeductionsApi.create(payload);
}

export async function updateDisciplinePayrollDeduction(
  id: string,
  payload: UpdateDisciplinePayrollDeductionDto,
) {
  return disciplinePayrollDeductionsApi.update(id, payload);
}
