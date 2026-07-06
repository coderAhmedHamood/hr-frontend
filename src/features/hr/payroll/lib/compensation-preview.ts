import type { PushToPayrollDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import type { HRPayrollPeriodRecord, HRPayrollPeriodIncludeFlags, HRPayrollMonthlyInput } from './payroll-periods-store';
import type { HRContractRecord } from '@/features/hr/contracts/lib/contracts-store';
import type { HRAllowanceTypeRecord } from '@/features/hr/contracts/lib/allowance-types-store';
import type {
  PayrollPeriodEmployeeSummaryRowDto,
  PayrollPeriodEmployeesSummaryResponseDto,
  PayrollPeriodEmployeesSummaryTotalsDto,
} from './api/payroll-periods';

export function formatLatinNumber(n: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    numberingSystem: 'latn',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

function round2(n: number) { return Math.round(n * 100) / 100; }

function parseSummaryAmount(raw: string): number {
  const n = parseFloat(raw);
  return round2(Number.isFinite(n) ? n : 0);
}

/** Maps GET /payroll/periods/:id/employees-payroll-summary row → table preview model. */
export function mapEmployeeSummaryRowToPreview(
  row: PayrollPeriodEmployeeSummaryRowDto,
): PayrollLineCompensationPreview {
  return {
    lineId: row.employeeId,
    employeeId: row.employeeId,
    namePrimary: row.employeeNameAr?.trim() || '—',
    baseSalary: parseSummaryAmount(row.baseSalary),
    allowancesMonthlyTotal: parseSummaryAmount(row.allowancesTotal),
    allowanceLines: row.allowances.map((a) => ({
      labelAr: a.allowanceTypeNameAr?.trim() || a.allowanceTypeCode?.trim() || '—',
      amount: parseSummaryAmount(a.amount),
    })),
    entitlementOvertimeSar: parseSummaryAmount(row.overtime),
    entitlementOvertimeHours: 0,
    entitlementBonusSar: parseSummaryAmount(row.bonuses),
    dedAbsenceDays: 0,
    dedAbsenceSar: parseSummaryAmount(row.absence),
    dedLateSar: parseSummaryAmount(row.lateness),
    dedLateMinutes: 0,
    dedPenaltiesSar: parseSummaryAmount(row.penalties),
    dedAdvancesSar: parseSummaryAmount(row.advances),
    manualAdditionSar: parseSummaryAmount(row.manualAddition),
    manualDeductionSar: parseSummaryAmount(row.manualDeduction),
    dedAdminSar: parseSummaryAmount(row.manualAddition) - parseSummaryAmount(row.manualDeduction),
    grossSar: parseSummaryAmount(row.gross),
    lineNetSar: parseSummaryAmount(row.net),
  };
}

export function mapEmployeesPayrollSummaryToPreviews(
  summary: PayrollPeriodEmployeesSummaryResponseDto,
): PayrollLineCompensationPreview[] {
  return summary.employees.map(mapEmployeeSummaryRowToPreview);
}

export function parseSummaryTotalsAmount(raw: string): number {
  return parseSummaryAmount(raw);
}

export type PayrollSummaryFooterTotals = {
  baseSalary: number;
  allowancesTotal: number;
  overtime: number;
  bonuses: number;
  advances: number;
  absence: number;
  lateness: number;
  penalties: number;
  manualAdminSigned: number;
  gross: number;
  net: number;
};

function mapSummaryTotalsDto(t: PayrollPeriodEmployeesSummaryTotalsDto): PayrollSummaryFooterTotals {
  return {
    baseSalary: parseSummaryTotalsAmount(t.baseSalary),
    allowancesTotal: parseSummaryTotalsAmount(t.allowancesTotal),
    overtime: parseSummaryTotalsAmount(t.overtime),
    bonuses: parseSummaryTotalsAmount(t.bonuses),
    advances: parseSummaryTotalsAmount(t.advances),
    absence: parseSummaryTotalsAmount(t.absence),
    lateness: parseSummaryTotalsAmount(t.lateness),
    penalties: parseSummaryTotalsAmount(t.penalties),
    manualAdminSigned:
      parseSummaryTotalsAmount(t.manualAddition) - parseSummaryTotalsAmount(t.manualDeduction),
    gross: parseSummaryTotalsAmount(t.gross),
    net: parseSummaryTotalsAmount(t.net),
  };
}

function sumPreviewRows(
  previews: PayrollLineCompensationPreview[],
  pick: (row: PayrollLineCompensationPreview) => number,
): number {
  return previews.reduce((sum, row) => sum + pick(row), 0);
}

/** Footer totals from API `totals`, or sum of backend row values when filtered. */
export function resolvePayrollSummaryFooterTotals(
  summary: PayrollPeriodEmployeesSummaryResponseDto | undefined,
  previews: PayrollLineCompensationPreview[],
  isFiltered: boolean,
): PayrollSummaryFooterTotals | null {
  if (!summary) return null;
  if (!isFiltered && summary.totals) {
    return mapSummaryTotalsDto(summary.totals);
  }
  if (previews.length === 0) return null;
  return {
    baseSalary: sumPreviewRows(previews, (r) => r.baseSalary),
    allowancesTotal: sumPreviewRows(previews, (r) => r.allowancesMonthlyTotal),
    overtime: sumPreviewRows(previews, (r) => r.entitlementOvertimeSar),
    bonuses: sumPreviewRows(previews, (r) => r.entitlementBonusSar),
    advances: sumPreviewRows(previews, (r) => r.dedAdvancesSar),
    absence: sumPreviewRows(previews, (r) => r.dedAbsenceSar),
    lateness: sumPreviewRows(previews, (r) => r.dedLateSar),
    penalties: sumPreviewRows(previews, (r) => r.dedPenaltiesSar),
    manualAdminSigned: sumPreviewRows(previews, (r) => r.dedAdminSar),
    gross: sumPreviewRows(previews, (r) => r.grossSar),
    net: sumPreviewRows(previews, (r) => r.lineNetSar),
  };
}

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
  manualAdditionSar: number;
  manualDeductionSar: number;
  dedAdminSar: number;
  grossSar: number;
  lineNetSar: number;
};

export type PayrollPrintRow = {
  no: number;
  employeeName: string;
  baseSalary: number;
  allowancesTotal: number;
  allowanceLines: { labelAr: string; amount: number }[];
  overtime: number;
  bonuses: number;
  gross: number;
  advances: number;
  absence: number;
  lateness: number;
  penalties: number;
  manualNet: number;
  net: number;
};

export function mapPreviewToPayrollPrintRow(
  row: PayrollLineCompensationPreview,
  no: number,
): PayrollPrintRow {
  return {
    no,
    employeeName: row.namePrimary,
    baseSalary: row.baseSalary,
    allowancesTotal: row.allowancesMonthlyTotal,
    allowanceLines: row.allowanceLines,
    overtime: row.entitlementOvertimeSar,
    bonuses: row.entitlementBonusSar,
    gross: row.grossSar,
    advances: row.dedAdvancesSar,
    absence: row.dedAbsenceSar,
    lateness: row.dedLateSar,
    penalties: row.dedPenaltiesSar,
    manualNet: row.dedAdminSar,
    net: row.lineNetSar,
  };
}

export function mapPreviewsToPayrollPrintRows(
  previews: PayrollLineCompensationPreview[],
): PayrollPrintRow[] {
  return previews.map((row, i) => mapPreviewToPayrollPrintRow(row, i + 1));
}

export type PayrollPrintTotals = Omit<PayrollPrintRow, 'no' | 'employeeName' | 'allowanceLines'>;

export function sumPayrollPrintRows(rows: PayrollPrintRow[]): PayrollPrintTotals {
  return rows.reduce<PayrollPrintTotals>(
    (acc, row) => ({
      baseSalary: acc.baseSalary + row.baseSalary,
      allowancesTotal: acc.allowancesTotal + row.allowancesTotal,
      overtime: acc.overtime + row.overtime,
      bonuses: acc.bonuses + row.bonuses,
      gross: acc.gross + row.gross,
      advances: acc.advances + row.advances,
      absence: acc.absence + row.absence,
      lateness: acc.lateness + row.lateness,
      penalties: acc.penalties + row.penalties,
      manualNet: acc.manualNet + row.manualNet,
      net: acc.net + row.net,
    }),
    {
      baseSalary: 0,
      allowancesTotal: 0,
      overtime: 0,
      bonuses: 0,
      gross: 0,
      advances: 0,
      absence: 0,
      lateness: 0,
      penalties: 0,
      manualNet: 0,
      net: 0,
    },
  );
}

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

/** UI options for push-from-attendance dialog. Maps to whitelisted PushToPayrollDto fields only. */
export type CompensationPushOptions = {
  replaceExisting: boolean;
  /** → applyOvertime in API */
  applyOvertime: boolean;
  /** UI: show absence columns + allow absenceDailyRateOverride in API (deduction is automatic for absent days). */
  applyAbsence: boolean;
  /** UI: show lateness columns + allow lateMinuteRateOverride in API (deduction is automatic for late days). */
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

/** Maps dialog options → POST /attendance/day-summaries/push-to-payroll (whitelisted DTO fields only). */
export function buildAttendancePushToPayrollPayload(
  opts: CompensationPushOptions,
  ctx: {
    payrollPeriodId: string;
    employeeIds?: string[];
    createdBy?: string;
  },
): PushToPayrollDto {
  const absenceOverride = opts.applyAbsence
    ? parseOptionalPositiveRate(opts.absenceDailyRateOverride)
    : undefined;
  const lateOverride = opts.applyLateness
    ? parseOptionalPositiveRate(opts.lateMinuteRateOverride)
    : undefined;
  const overtimeMultiplier = parseOptionalPositiveRate(opts.overtimeMultiplier) ?? 1.5;

  return {
    payrollPeriodId: ctx.payrollPeriodId,
    employeeIds: ctx.employeeIds,
    replaceExisting: opts.replaceExisting,
    applyOvertime: opts.applyOvertime,
    ...(absenceOverride !== undefined ? { absenceDailyRateOverride: absenceOverride } : {}),
    ...(lateOverride !== undefined ? { lateMinuteRateOverride: lateOverride } : {}),
    overtimeMultiplier,
    createdBy: ctx.createdBy ?? null,
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
      manualAdditionSar: dedAdminSar > 0 ? dedAdminSar : 0,
      manualDeductionSar: dedAdminSar < 0 ? -dedAdminSar : 0,
      dedAdminSar,
      grossSar: lineNetSar,
      lineNetSar,
    };
  });

  /* Use real monthly inputs + contract snapshots only (no PRNG overlay). */
  return rows;
}
