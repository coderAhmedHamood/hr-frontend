import type { EmployeePayslipHistoryItemDto } from '@/features/hr/organization/employees/lib/api/employee-payslips';
import type { Payslip } from '@/features/hr/payroll/types';
import type { PayslipResponseDto, PayslipStatusDto } from '@/features/hr/payroll/lib/api/payslips';

const PAYSLIP_MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

const PAYSLIP_STATUSES: PayslipStatusDto[] = ['draft', 'approved', 'paid'];

function coercePayslipStatus(value: string | null | undefined): PayslipStatusDto {
  if (value && PAYSLIP_STATUSES.includes(value as PayslipStatusDto)) {
    return value as PayslipStatusDto;
  }
  return 'draft';
}

export function mapEmployeePayslipHistoryItem(
  item: EmployeePayslipHistoryItemDto,
  employeeId: string,
): Payslip {
  const period = item.payrollPeriod;
  const status = coercePayslipStatus(item.status ?? period.status ?? undefined);

  return {
    id: item.id,
    employeeId,
    month: period.periodMonth
      ? PAYSLIP_MONTHS_AR[(period.periodMonth - 1) % 12] ?? period.periodLabel ?? '—'
      : period.periodLabel ?? '—',
    year: period.periodYear ?? 0,
    status,
    baseSalary: parseFloat(item.baseSalary ?? '0') || 0,
    housing: 0,
    transport: 0,
    otherAllowances: 0,
    overtime: 0,
    gosi: 0,
    absenceDeduction: 0,
    latenessDeduction: 0,
    loanDeduction: 0,
    otherDeductions: 0,
    gross: parseFloat(item.gross ?? '0') || 0,
    net: parseFloat(item.net ?? '0') || 0,
    workingDays: item.workingDays ?? 0,
    presentDays: item.presentDays ?? 0,
    absentDays: item.absentDays ?? 0,
    lateDays: item.lateDays ?? 0,
  };
}

export function mapPayslipListItem(item: PayslipResponseDto): Payslip {
  return {
    id: item.id,
    employeeId: item.employeeId,
    month: item.periodMonth != null ? PAYSLIP_MONTHS_AR[(item.periodMonth - 1) % 12] ?? '' : '',
    year: item.periodYear ?? 0,
    status: coercePayslipStatus(item.status),
    baseSalary: parseFloat(item.baseSalary) || 0,
    housing: 0,
    transport: 0,
    otherAllowances: parseFloat(item.allowancesTotal) || 0,
    overtime: parseFloat(item.additionsTotal) || 0,
    gosi: parseFloat(item.gosi) || 0,
    absenceDeduction: 0,
    latenessDeduction: 0,
    loanDeduction: 0,
    otherDeductions: parseFloat(item.deductionsTotal) || 0,
    gross: parseFloat(item.gross) || 0,
    net: parseFloat(item.net) || 0,
    workingDays: item.workingDays ?? 0,
    presentDays: item.presentDays ?? 0,
    absentDays: item.absentDays ?? 0,
    lateDays: item.lateDays ?? 0,
  };
}
