import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';
import type { CheckInPointResponseDto, CreateCheckInPointDto, UpdateCheckInPointDto, CheckInPointListQuery } from '@/features/hr/attendance/types/api/check-in-points';
export type { CheckInPointResponseDto, CreateCheckInPointDto, UpdateCheckInPointDto, CheckInPointListQuery } from '@/features/hr/attendance/types/api/check-in-points';





export const checkInPointsApi = {
  getAll(query?: CheckInPointListQuery) {
    return apiRequest<PaginatedResult<CheckInPointResponseDto>>('/attendance/check-in-points', { query });
  },
  getById(id: string) {
    return apiRequest<CheckInPointResponseDto>(`/attendance/check-in-points/${id}`);
  },
  create(payload: CreateCheckInPointDto) {
    return apiRequest<CheckInPointResponseDto>('/attendance/check-in-points', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateCheckInPointDto) {
    return apiRequest<CheckInPointResponseDto>(`/attendance/check-in-points/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/attendance/check-in-points/${id}`, { method: 'DELETE' });
  },
};

