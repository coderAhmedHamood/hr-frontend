import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ApplicationResponseDto = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  status: string;
};

export const applicationsApi = {
  getAll(query?: { limit?: number }) {
    return apiRequest<PaginatedResult<ApplicationResponseDto>>('/applications', { query });
  },
};
