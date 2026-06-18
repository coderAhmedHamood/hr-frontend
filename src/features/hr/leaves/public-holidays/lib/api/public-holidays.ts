import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type PublicHolidayResponseDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  monthDay: string;
  recurring: boolean;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreatePublicHolidayDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  monthDay: string;
  recurring?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdatePublicHolidayDto = Omit<Partial<CreatePublicHolidayDto>, 'companyId'>;

export type PublicHolidayListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
};

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
