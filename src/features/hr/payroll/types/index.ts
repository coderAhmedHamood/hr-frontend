export interface PayrollRun {
  id: string;
  month: string;
  year: number;
  status: 'draft' | 'processing' | 'completed';
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  employeesCount: number;
  processedAt?: string;
}

import type { PayslipStatusDto } from '@/features/hr/payroll/lib/api/payslips';

export interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  status: PayslipStatusDto;
  baseSalary: number;
  housing: number;
  transport: number;
  otherAllowances: number;
  overtime: number;
  gosi: number;
  absenceDeduction: number;
  latenessDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
  gross: number;
  net: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
}
