import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

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

export const balanceCreditsApi = {
  getAll(query?: BalanceCreditListQuery) {
    return apiRequest<PaginatedResult<BalanceCreditRequestResponseDto>>('/leaves/balance-credits', { query });
  },
  getById(id: string) {
    return apiRequest<BalanceCreditRequestResponseDto>(`/leaves/balance-credits/${id}`);
  },
  create(payload: CreateBalanceCreditRequestDto) {
    return apiRequest<BalanceCreditRequestResponseDto>('/leaves/balance-credits', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateBalanceCreditRequestDto) {
    return apiRequest<BalanceCreditRequestResponseDto>(`/leaves/balance-credits/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/leaves/balance-credits/${id}`, { method: 'DELETE' });
  },
};
