import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type EmployeeLeaveBalanceTypeItemDto = {
  id: string;
  leaveTypeId: string;
  leaveTypeNameAr: string;
  leaveTypeCode: string | null;
  usedDays: number;
  totalDays: number;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type EmployeeLeaveBalanceGroupDto = {
  employeeId: string;
  employeeNameAr: string;
  companyId: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  leaveTypes: EmployeeLeaveBalanceTypeItemDto[];
};

/** Flat row shape used by create/update/getById and edit dialogs. */
export type EmployeeLeaveBalanceResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  usedDays: number;
  totalDays: number;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type LeaveBalanceListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  leaveTypeId?: string;
};

export type CreateLeaveBalanceDto = {
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  usedDays: number;
  totalDays: number;
  createdBy?: string;
};

export type UpdateLeaveBalanceDto = {
  usedDays?: number;
  totalDays?: number;
  updatedBy?: string;
};

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
