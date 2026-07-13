export type BalanceCreditStatus = 'pending' | 'approved' | 'rejected';

export type BalanceCreditRequestResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  daysAdded: number;
  reasonAr: string | null;
  status: BalanceCreditStatus;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateBalanceCreditRequestDto = {
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  daysAdded: number;
  reasonAr?: string | null;
  status?: BalanceCreditStatus;
  createdBy?: string | null;
};

export type CreateBulkBalanceCreditRequestDto = {
  companyId: string;
  employeeIds: string[];
  leaveTypeId: string;
  daysAdded: number;
  reasonAr?: string | null;
  status?: BalanceCreditStatus;
  createdBy?: string | null;
};

export type BulkBalanceCreditRequestResponseDto = {
  items: BalanceCreditRequestResponseDto[];
};

export type UpdateBalanceCreditRequestDto = {
  status?: BalanceCreditStatus;
  reasonAr?: string | null;
  updatedBy?: string | null;
};

export type BalanceCreditListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  leaveTypeId?: string;
  status?: BalanceCreditStatus;
};
