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
};
