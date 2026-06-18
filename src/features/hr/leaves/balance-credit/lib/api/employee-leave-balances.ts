import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  EmployeeLeaveBalanceGroupDto,
  EmployeeLeaveBalanceResponseDto,
  LeaveBalanceListQuery,
} from '@/features/hr/leaves/lib/api/leave-balances';

export type {
  EmployeeLeaveBalanceGroupDto,
  EmployeeLeaveBalanceResponseDto,
};

export type EmployeeLeaveBalanceListQuery = LeaveBalanceListQuery;

export const employeeLeaveBalancesApi = {
  getAll(query?: EmployeeLeaveBalanceListQuery) {
    return apiRequest<PaginatedResult<EmployeeLeaveBalanceGroupDto>>('/leaves/balances', { query });
  },
};
