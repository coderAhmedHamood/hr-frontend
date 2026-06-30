import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';
import type { LeaveTypeResponseDto, CreateLeaveTypeDto, UpdateLeaveTypeDto, LeaveTypeListQuery } from '@/features/hr/leaves/types/api/leave-types';
export type { LeaveTypeResponseDto, CreateLeaveTypeDto, UpdateLeaveTypeDto, LeaveTypeListQuery } from '@/features/hr/leaves/types/api/leave-types';





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

