import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type LeaveTypeResponseDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  paid: boolean;
  deductsFromBalance: boolean;
  requiresApproval: boolean;
  maxDaysPerRequest: number | null;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateLeaveTypeDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  paid?: boolean;
  deductsFromBalance?: boolean;
  requiresApproval?: boolean;
  maxDaysPerRequest?: number | null;
  sortOrder?: number;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdateLeaveTypeDto = Omit<Partial<CreateLeaveTypeDto>, 'companyId'>;

export type LeaveTypeListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
};

export const leaveTypesApi = {
  getAll(query?: LeaveTypeListQuery) {
    return apiRequest<PaginatedResult<LeaveTypeResponseDto>>('/leaves/types', { query });
  },
  getById(id: string) {
    return apiRequest<LeaveTypeResponseDto>(`/leaves/types/${id}`);
  },
  create(payload: CreateLeaveTypeDto) {
    return apiRequest<LeaveTypeResponseDto>('/leaves/types', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateLeaveTypeDto) {
    return apiRequest<LeaveTypeResponseDto>(`/leaves/types/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/leaves/types/${id}`, { method: 'DELETE' });
  },
};
