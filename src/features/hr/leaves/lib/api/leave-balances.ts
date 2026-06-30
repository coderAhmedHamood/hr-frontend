import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { EmployeeLeaveBalanceTypeItemDto, EmployeeLeaveBalanceGroupDto, EmployeeLeaveBalanceResponseDto, LeaveBalanceListQuery, CreateLeaveBalanceDto, UpdateLeaveBalanceDto } from '@/features/hr/leaves/types/api/leave-balances';
export type { EmployeeLeaveBalanceTypeItemDto, EmployeeLeaveBalanceGroupDto, EmployeeLeaveBalanceResponseDto, LeaveBalanceListQuery, CreateLeaveBalanceDto, UpdateLeaveBalanceDto } from '@/features/hr/leaves/types/api/leave-balances';



/** Flat row shape used by create/update/getById and edit dialogs. */




export function flattenLeaveBalanceGroups(
  groups: EmployeeLeaveBalanceGroupDto[],
): EmployeeLeaveBalanceResponseDto[] {
  return groups.flatMap((group) =>
    group.leaveTypes.map((lt) => ({
      id: lt.id,
      companyId: group.companyId,
      employeeId: group.employeeId,
      leaveTypeId: lt.leaveTypeId,
      usedDays: lt.usedDays,
      totalDays: lt.totalDays,
      remainingDays: lt.remainingDays,
      createdAt: lt.createdAt,
      updatedAt: lt.updatedAt,
      createdBy: lt.createdBy,
      updatedBy: lt.updatedBy,
    })),
  );
}

export const leaveBalancesApi = {
  getAll(query?: LeaveBalanceListQuery) {
    return apiRequest<PaginatedResult<EmployeeLeaveBalanceGroupDto>>('/leaves/balances', { query });
  },
  getById(id: string) {
    return apiRequest<EmployeeLeaveBalanceResponseDto>(`/leaves/balances/${id}`);
  },
  create(payload: CreateLeaveBalanceDto) {
    return apiRequest<EmployeeLeaveBalanceResponseDto>('/leaves/balances', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateLeaveBalanceDto) {
    return apiRequest<EmployeeLeaveBalanceResponseDto>(`/leaves/balances/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/leaves/balances/${id}`, { method: 'DELETE' });
  },
};

