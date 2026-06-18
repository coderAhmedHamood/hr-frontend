import { apiRequest } from '@/features/hr/lib/api/client';
import type { PayslipStatusDto } from '@/features/hr/payroll/lib/api/payslips';

export type EmployeePayslipPeriodDto = {
  id: string;
  periodYear: number;
  periodMonth: number;
  periodLabel?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  payrollDate?: string | null;
  status?: string | null;
};

export type EmployeePayslipHistoryItemDto = {
  id: string;
  status?: PayslipStatusDto | string | null;
  net?: string | null;
  gross?: string | null;
  baseSalary?: string | null;
  workingDays?: number | null;
  presentDays?: number | null;
  absentDays?: number | null;
  lateDays?: number | null;
  payrollPeriod: EmployeePayslipPeriodDto;
};

export type EmployeePayslipHistoryResponseDto = {
  counts: {
    totalPayslips: number;
    draft: number;
    approved: number;
    paid: number;
  };
  totals: {
    totalNet: string;
    totalNetPaid: string;
    totalGross: string;
    averageNet: string;
    maxNet: string;
    minNet: string;
    currency: string;
  };
  payslipsHistory: EmployeePayslipHistoryItemDto[];
};

export const employeePayslipsApi = {
  getHistory(employeeId: string, query: { companyId: string }) {
    return apiRequest<EmployeePayslipHistoryResponseDto>(
      `/hr/employees/${employeeId}/payslips`,
      { query },
    );
  },
};
