import type { HRPayrollPeriodRecord, HRPayrollPeriodIncludeFlags, HRPayrollMonthlyInput } from './payroll-periods-store';
import type { HRContractRecord } from '@/features/hr/contracts/lib/contracts-store';
import type { HRAllowanceTypeRecord } from '@/features/hr/contracts/lib/allowance-types-store';

export function formatLatinNumber(n: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export type PayrollLineCompensationPreview = {
  lineId: string;
  employeeId: string;
  namePrimary: string;
  baseSalary: number;
  allowancesMonthlyTotal: number;
  allowanceLines: { labelAr: string; amount: number }[];
  entitlementOvertimeSar: number;
  entitlementOvertimeHours: number;
  entitlementBonusSar: number;
  dedAbsenceDays: number;
  dedAbsenceSar: number;
  dedLateSar: number;
  dedLateMinutes: number;
  dedPenaltiesSar: number;
  dedAdvancesSar: number;
  dedAdminSar: number;
  lineNetSar: number;
};

export type CompensationColumnVisibility = {
  colOvertime: boolean;
  colBonus: boolean;
  colDedAbsence: boolean;
  colDedLate: boolean;
  colDedPenalties: boolean;
  colDedAdvances: boolean;
  colDedAdmin: boolean;
};

export const DEFAULT_COMPENSATION_COLUMN_VISIBILITY: CompensationColumnVisibility = {
  colOvertime: true,
  colBonus: true,
  colDedAbsence: true,
  colDedLate: true,
  colDedPenalties: true,
  colDedAdvances: true,
  colDedAdmin: true,
};

/** Maps GET /payroll/periods include* flags → compensation table columns. */
export function periodToColumnVisibility(
  period: Pick<
    HRPayrollPeriodRecord,
    | 'includeOvertime'
    | 'includeBonuses'
    | 'includeAdvances'
    | 'includeAbsence'
    | 'includeLateness'
    | 'includePenalties'
    | 'includeManualInputs'
  >,
): CompensationColumnVisibility {
  return {
    colOvertime: period.includeOvertime,
    colBonus: period.includeBonuses,
    colDedAbsence: period.includeAbsence,
    colDedLate: period.includeLateness,
    colDedPenalties: period.includePenalties,
    colDedAdvances: period.includeAdvances,
    colDedAdmin: period.includeManualInputs,
  };
}

export const COLUMN_TO_PERIOD_INCLUDE: Record<
  keyof CompensationColumnVisibility,
  keyof HRPayrollPeriodIncludeFlags
> = {
  colOvertime: 'includeOvertime',
  colBonus: 'includeBonuses',
  colDedAdvances: 'includeAdvances',
  colDedAbsence: 'includeAbsence',
  colDedLate: 'includeLateness',
  colDedPenalties: 'includePenalties',
  colDedAdmin: 'includeManualInputs',
};

/** Controls POST /attendance/day-summaries/push-to-payroll and table column visibility for attendance-sourced fields. */
export type CompensationPushOptions = {
  replaceExisting: boolean;
  applyOvertime: boolean;
  applyAbsence: boolean;
  applyLateness: boolean;
  absenceDailyRateOverride: string;
  lateMinuteRateOverride: string;
  overtimeMultiplier: string;
};

export const DEFAULT_COMPENSATION_PUSH_OPTIONS: CompensationPushOptions = {
  replaceExisting: true,
  applyOvertime: false,
  applyAbsence: true,
  applyLateness: true,
  absenceDailyRateOverride: '',
  lateMinuteRateOverride: '',
  overtimeMultiplier: '1.5',
};

/** Controls POST /payroll/employee-advances/push-to-payroll */
export type CompensationAdvancesPushOptions = {
  replaceExisting: boolean;
  employeeIds: string[];
};

export const DEFAULT_COMPENSATION_ADVANCES_PUSH_OPTIONS: CompensationAdvancesPushOptions = {
  replaceExisting: true,
  employeeIds: [],
};

/** Controls POST /discipline/violation-records/push-to-payroll */
export type CompensationViolationsPushOptions = {
  replaceExisting: boolean;
  employeeIds: string[];
};

export const DEFAULT_COMPENSATION_VIOLATIONS_PUSH_OPTIONS: CompensationViolationsPushOptions = {
  replaceExisting: true,
  employeeIds: [],
};

export function pushOptionsToColumnVisibility(
  opts: CompensationPushOptions,
): CompensationColumnVisibility {
  return {
    colOvertime: opts.applyOvertime,
    colBonus: true,
    colDedAbsence: opts.applyAbsence,
    colDedLate: opts.applyLateness,
    colDedPenalties: true,
    colDedAdvances: true,
    colDedAdmin: true,
  };
}

export function parseOptionalPositiveRate(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

export function lineNetFromVisibleColumns(
  row: PayrollLineCompensationPreview,
  v: CompensationColumnVisibility,
): number {
  let t = row.baseSalary + row.allowancesMonthlyTotal;
  if (v.colOvertime) t += row.entitlementOvertimeSar;
  if (v.colBonus) t += row.entitlementBonusSar;
  if (v.colDedAbsence) t -= row.dedAbsenceSar;
  if (v.colDedLate) t -= row.dedLateSar;
  if (v.colDedPenalties) t -= row.dedPenaltiesSar;
  if (v.colDedAdvances) t -= row.dedAdvancesSar;
  if (v.colDedAdmin) t += row.dedAdminSar;
  return round2(t);
}

export type CompensationEditValues = {
  overtime: string;
  bonus: string;
  absenceSar: string;
  late: string;
  penalties: string;
  advances: string;
  admin: string;
};

function parseEditAmount(raw: string): number {
  return Math.max(0, parseFloat(raw) || 0);
}

function parseSignedEditAmount(raw: string): number {
  const n = parseFloat(raw);
  return round2(Number.isFinite(n) ? n : 0);
}

/** Signed amount for خصم او اضافة مباشرة (+ addition, − deduction). */
export function editSignedAmount(raw: string): number {
  return parseSignedEditAmount(raw);
}

/** Net salary from live edit inputs + visible columns (respects hidden columns in totals). */
export function lineNetFromEditRow(
  baseSalary: number,
  allowancesMonthlyTotal: number,
  edit: CompensationEditValues,
  v: CompensationColumnVisibility,
): number {
  let t = baseSalary + allowancesMonthlyTotal;
  if (v.colOvertime) t += parseEditAmount(edit.overtime);
  if (v.colBonus) t += parseEditAmount(edit.bonus);
  if (v.colDedAbsence) t -= parseEditAmount(edit.absenceSar);
  if (v.colDedLate) t -= parseEditAmount(edit.late);
  if (v.colDedPenalties) t -= parseEditAmount(edit.penalties);
  if (v.colDedAdvances) t -= parseEditAmount(edit.advances);
  if (v.colDedAdmin) t += parseSignedEditAmount(edit.admin);
  return round2(t);
}

export function editAmount(raw: string): number {
  return parseEditAmount(raw);
}

export function editValuesEqual(a: string, b: string): boolean {
  return parseSignedEditAmount(a) === parseSignedEditAmount(b);
}

export function buildCompensationPreviews(
  period: HRPayrollPeriodRecord,
  getContract: (id: string) => HRContractRecord | undefined,
  getAlloType: (id: string) => HRAllowanceTypeRecord | undefined,
): PayrollLineCompensationPreview[] {
  const lines = [...(period.employmentLines ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const monthlyInputs = period.employmentLineMonthlyInputs ?? {};

  const rows: PayrollLineCompensationPreview[] = lines.map(line => {
    const contract = getContract(line.contractId);
    const allowanceLines = (contract?.allowanceLines ?? []).map(al => {
      const at = getAlloType(al.allowanceTypeId);
      return { labelAr: at?.nameAr ?? al.allowanceTypeId, amount: al.amount };
    });
    const allowancesMonthlyTotal = round2(allowanceLines.reduce((s, a) => s + a.amount, 0));

    const lineInputs: HRPayrollMonthlyInput[] = monthlyInputs[line.id] ?? [];
    const sum = (kind: HRPayrollMonthlyInput['kind']) =>
      lineInputs.filter(x => x.kind === kind).reduce((s, x) => s + x.value, 0);

    const entitlementOvertimeSar = round2(sum('overtime_hours'));
    const entitlementBonusSar = round2(sum('allowance_amount'));
    const dedAbsenceDays = round2(sum('absence_days'));
    const dedAbsenceSar = round2(sum('absence_days') * (line.baseSalarySnapshot / 30));
    const dedLateSar = round2(sum('late_minutes'));
    const dedLateMinutes = round2(sum('late_minutes'));
    const dedPenaltiesSar = round2(sum('deduction_amount'));
    const dedAdvancesSar  = round2(sum('advance_recovery'));
    const dedAdminSar     = round2(sum('other'));
    const lineNetSar = round2(
      line.baseSalarySnapshot + allowancesMonthlyTotal + entitlementOvertimeSar + entitlementBonusSar
      - dedAbsenceSar - dedLateSar - dedPenaltiesSar - dedAdvancesSar + dedAdminSar,
    );

    return {
      lineId: line.id,
      employeeId: line.employeeId,
      namePrimary: line.employeeNameAr,
      baseSalary: line.baseSalarySnapshot,
      allowancesMonthlyTotal,
      allowanceLines,
      entitlementOvertimeSar,
      entitlementOvertimeHours: round2(sum('overtime_hours')),
      entitlementBonusSar,
      dedAbsenceDays,
      dedAbsenceSar,
      dedLateSar,
      dedLateMinutes,
      dedPenaltiesSar,
      dedAdvancesSar,
      dedAdminSar,
      lineNetSar,
    };
  });

  /* Use real monthly inputs + contract snapshots only (no PRNG overlay). */
  return rows;
}
