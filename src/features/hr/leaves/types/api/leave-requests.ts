export type LeaveRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'under_review';

export type LeaveRequestResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  employeeAssignmentId: string | null;
  status: LeaveRequestStatus;
  startDate: string | null;
  endDate: string | null;
  workingDays: number | null;
  noteAr: string | null;
  noteEn: string | null;
  approvalChain: Record<string, unknown>[] | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type LeaveRequestListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  leaveTypeId?: string;
  employeeAssignmentId?: string;
  status?: LeaveRequestStatus;
};

export type CreateLeaveRequestDto = {
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  employeeAssignmentId?: string | null;
  status?: LeaveRequestStatus;
  startDate?: string | null;
  endDate?: string | null;
  workingDays?: number | null;
  noteAr?: string | null;
};

export type UpdateLeaveRequestDto = Partial<
  Pick<CreateLeaveRequestDto, 'status' | 'startDate' | 'endDate' | 'workingDays' | 'noteAr'>
>;
