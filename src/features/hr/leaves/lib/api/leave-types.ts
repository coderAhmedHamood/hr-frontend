import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { LeaveTypeResponseDto, LeaveTypeListQuery } from '@/features/hr/leaves/types/api/leave-types';
export type { LeaveTypeResponseDto, CreateLeaveTypeDto, UpdateLeaveTypeDto, LeaveTypeListQuery } from '@/features/hr/leaves/types/api/leave-types';



export const leaveTypesApi = {
  getAll(query?: LeaveTypeListQuery) {
    return apiRequest<PaginatedResult<LeaveTypeResponseDto>>('/leaves/types', { query });
  },
  getById(id: string) {
    return apiRequest<LeaveTypeResponseDto>(`/leaves/types/${id}`);
  },
};

