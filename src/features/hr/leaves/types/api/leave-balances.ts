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

export type EmployeeLeaveBalanceResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeNameAr?: string;
  leaveTypeCode?: string | null;
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
