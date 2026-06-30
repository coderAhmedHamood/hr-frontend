import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { PayrollDeductionTypeDto, PayrollDeductionStatusDto, DisciplinePayrollDeductionResponseDto, CreateDisciplinePayrollDeductionDto, UpdateDisciplinePayrollDeductionDto, DisciplinePayrollDeductionListQuery } from '@/features/hr/discipline/types/api/discipline-payroll-deductions';
export type { PayrollDeductionTypeDto, PayrollDeductionStatusDto, DisciplinePayrollDeductionResponseDto, CreateDisciplinePayrollDeductionDto, UpdateDisciplinePayrollDeductionDto, DisciplinePayrollDeductionListQuery } from '@/features/hr/discipline/types/api/discipline-payroll-deductions';






export const disciplinePayrollDeductionsApi = {
  getAll(query?: DisciplinePayrollDeductionListQuery) {
    return apiRequest<PaginatedResult<DisciplinePayrollDeductionResponseDto>>('/discipline/payroll-deductions', { query });
  },
  getById(id: string) {
    return apiRequest<DisciplinePayrollDeductionResponseDto>(`/discipline/payroll-deductions/${id}`);
  },
  create(payload: CreateDisciplinePayrollDeductionDto) {
    return apiRequest<DisciplinePayrollDeductionResponseDto>('/discipline/payroll-deductions', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateDisciplinePayrollDeductionDto) {
    return apiRequest<DisciplinePayrollDeductionResponseDto>(`/discipline/payroll-deductions/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  sendToPayroll(id: string) {
    return apiRequest<DisciplinePayrollDeductionResponseDto>(`/discipline/payroll-deductions/${id}/send-to-payroll`, {
      method: 'POST',
    });
  },
  markApplied(id: string) {
    return apiRequest<DisciplinePayrollDeductionResponseDto>(`/discipline/payroll-deductions/${id}/mark-applied`, {
      method: 'POST',
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/payroll-deductions/${id}`, { method: 'DELETE' });
  },
};

