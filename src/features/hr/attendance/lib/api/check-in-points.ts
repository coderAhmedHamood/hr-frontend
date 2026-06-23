import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type CheckInPointResponseDto = {
  id: string;
  companyId: string;
  nameAr: string;
  nameEn: string | null;
  latitude: string;
  longitude: string;
  radiusMeters: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateCheckInPointDto = {
  companyId: string;
  nameAr: string;
  nameEn?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive?: boolean;
};

export type UpdateCheckInPointDto = Omit<Partial<CreateCheckInPointDto>, 'companyId'>;

export type CheckInPointListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
  archiveScope?: OrganizationArchiveScope;
};

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
