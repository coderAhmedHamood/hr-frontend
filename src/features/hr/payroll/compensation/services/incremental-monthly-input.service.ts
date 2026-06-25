import { monthlyInputsApi, type MonthlyInputDirectionDto, type MonthlyInputKindDto } from '@/features/hr/payroll/lib/api/monthly-inputs';

export type IncrementAdjustField = 'bonus' | 'admin';

export type CreateIncrementalMonthlyInputParams = {
  companyId: string;
  payrollPeriodId: string;
  employeeId: string;
  field: IncrementAdjustField;
  /** Required when field is `admin`. */
  direction?: MonthlyInputDirectionDto;
  amount: number;
  currency?: string;
  note?: string;
  createdBy?: string | null;
};

function resolveInputKind(
  field: IncrementAdjustField,
  direction: MonthlyInputDirectionDto,
): MonthlyInputKindDto {
  if (field === 'bonus') return 'bonus';
  return direction === 'addition' ? 'other_addition' : 'other_deduction';
}

/** POST /payroll/monthly-inputs — bonus or manual add/deduct via other_addition / other_deduction. */
export async function createIncrementalMonthlyInput(params: CreateIncrementalMonthlyInputParams) {
  const direction: MonthlyInputDirectionDto =
    params.field === 'bonus' ? 'addition' : (params.direction ?? 'addition');

  if (params.amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  return monthlyInputsApi.create({
    companyId: params.companyId,
    payrollPeriodId: params.payrollPeriodId,
    employeeId: params.employeeId,
    inputKind: resolveInputKind(params.field, direction),
    direction,
    amount: Math.round(params.amount * 100) / 100,
    currency: params.currency ?? 'SAR',
    note: params.note?.trim() || undefined,
    sourceKind: 'manual',
    sourceTable: 'frontend_compensation_panel',
    sourceId: params.employeeId,
    affectsSalary: true,
    createdBy: params.createdBy ?? undefined,
  });
}
