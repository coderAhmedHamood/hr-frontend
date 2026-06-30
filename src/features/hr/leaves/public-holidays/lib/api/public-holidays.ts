import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { PublicHolidayResponseDto, CreatePublicHolidayDto, UpdatePublicHolidayDto, PublicHolidayListQuery } from '@/features/hr/leaves/types/api/public-holidays';
export type { PublicHolidayResponseDto, CreatePublicHolidayDto, UpdatePublicHolidayDto, PublicHolidayListQuery } from '@/features/hr/leaves/types/api/public-holidays';





export const publicHolidaysApi = {
  getAll(query?: PublicHolidayListQuery) {
    return apiRequest<PaginatedResult<PublicHolidayResponseDto>>('/leaves/public-holidays', { query });
  },
  getById(id: string) {
    return apiRequest<PublicHolidayResponseDto>(`/leaves/public-holidays/${id}`);
  },
  create(payload: CreatePublicHolidayDto) {
    return apiRequest<PublicHolidayResponseDto>('/leaves/public-holidays', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdatePublicHolidayDto) {
    return apiRequest<PublicHolidayResponseDto>(`/leaves/public-holidays/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/leaves/public-holidays/${id}`, { method: 'DELETE' });
  },
};

