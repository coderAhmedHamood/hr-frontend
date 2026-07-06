import type { PayrollLineCompensationPreview } from '@/features/hr/payroll/lib/compensation-preview';
import type { EmployeeAdvanceListItemDto } from '@/features/hr/contracts/lib/api/employee-advances';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/types/api/attendance-day-summaries';
import type { MonthlyInputResponseDto } from '@/features/hr/payroll/lib/api/monthly-inputs';
import type { ViolationRecordResponseDto } from '@/features/hr/discipline/types/api/violation-records';

export type CompensationDetailField =
  | 'allowances'
  | 'baseSalary'
  | 'overtime'
  | 'bonus'
  | 'advances'
  | 'absence'
  | 'lateness'
  | 'penalties'
  | 'admin'
  | 'net';

export const COMPENSATION_DETAIL_FIELD_LABELS: Record<CompensationDetailField, string> = {
  allowances: 'البدلات',
  baseSalary: 'الراتب الأساسي',
  overtime: 'أوفر تايم',
  bonus: 'مكافآت',
  advances: 'السلف',
  absence: 'غياب',
  lateness: 'تأخير',
  penalties: 'جزاءات',
  admin: 'إضافة/خصم مباشر',
  net: 'الصافي',
};

export function getCompensationPreviewFieldAmount(
  row: PayrollLineCompensationPreview,
  field: CompensationDetailField,
): number {
  switch (field) {
    case 'allowances':
      return row.allowancesMonthlyTotal;
    case 'baseSalary':
      return row.baseSalary;
    case 'overtime':
      return row.entitlementOvertimeSar;
    case 'bonus':
      return row.entitlementBonusSar;
    case 'advances':
      return row.dedAdvancesSar;
    case 'absence':
      return row.dedAbsenceSar;
    case 'lateness':
      return row.dedLateSar;
    case 'penalties':
      return row.dedPenaltiesSar;
    case 'admin':
      return row.dedAdminSar;
    case 'net':
      return row.lineNetSar;
  }
}

export type CompensationCellDetailContext = {
  periodId: string;
  companyId: string;
  currency: string;
  periodStartDate: string;
  periodEndDate: string;
  row: PayrollLineCompensationPreview;
  field: CompensationDetailField;
};

export type CompensationCellDetailResult =
  | { kind: 'baseSalary' }
  | { kind: 'allowances' }
  | { kind: 'net' }
  | { kind: 'advances'; items: EmployeeAdvanceListItemDto[] }
  | { kind: 'absence'; days: DaySummaryResponseDto[] }
  | { kind: 'lateness'; days: DaySummaryResponseDto[] }
  | { kind: 'overtime'; days: DaySummaryResponseDto[] }
  | { kind: 'penalties'; violations: ViolationRecordResponseDto[] }
  | { kind: 'bonus'; items: MonthlyInputResponseDto[] }
  | { kind: 'admin'; items: MonthlyInputResponseDto[] };
