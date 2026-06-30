export type PayrollDeductionTypeDto = 'fixed_amount' | 'days' | 'hours';

export type PayrollDeductionStatusDto = 'pending' | 'sent_to_payroll' | 'applied' | 'cancelled';

export type DisciplinePayrollDeductionResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  violationRecordId: string;
  linkedViolationRecordNumber: string;
  investigationId: string | null;
  payrollPeriod: string;
  payrollPeriodId: string | null;
  deductionType: PayrollDeductionTypeDto;
  amount: string | null;
  daysCount: string | null;
  hoursCount: string | null;
  status: PayrollDeductionStatusDto;
  reasonAr: string | null;
  notes: string | null;
  sentToPayrollAt: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplinePayrollDeductionDto = {
  companyId: string;
  employeeId: string;
  violationRecordId?: string;
  linkedViolationRecordNumber?: string;
  investigationId?: string | null;
  payrollPeriod: string;
  payrollPeriodId?: string | null;
  deductionType: PayrollDeductionTypeDto;
  amount?: number;
  daysCount?: number;
  hoursCount?: number;
  reasonAr?: string | null;
  notes?: string | null;
  status?: PayrollDeductionStatusDto;
  createdBy?: string | null;
};

export type UpdateDisciplinePayrollDeductionDto = {
  payrollPeriod?: string;
  payrollPeriodId?: string | null;
  deductionType?: PayrollDeductionTypeDto;
  amount?: number | null;
  daysCount?: number | null;
  hoursCount?: number | null;
  status?: PayrollDeductionStatusDto;
  reasonAr?: string | null;
  notes?: string | null;
  updatedBy?: string | null;
};

export type DisciplinePayrollDeductionListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  violationRecordId?: string;
  payrollPeriod?: string;
  status?: PayrollDeductionStatusDto;
  deductionType?: PayrollDeductionTypeDto;
};
