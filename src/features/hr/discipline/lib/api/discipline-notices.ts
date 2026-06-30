import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { DisciplineNoticeResponseDto, CreateDisciplineNoticeDto, DisciplineNoticeListQuery } from '@/features/hr/discipline/types/api/discipline-notices';
export type { DisciplineNoticeResponseDto, CreateDisciplineNoticeDto, DisciplineNoticeListQuery } from '@/features/hr/discipline/types/api/discipline-notices';




export const disciplineNoticesApi = {
  getAll(query?: DisciplineNoticeListQuery) {
    return apiRequest<PaginatedResult<DisciplineNoticeResponseDto>>('/discipline/notices', { query });
  },
  getById(id: string) {
    return apiRequest<DisciplineNoticeResponseDto>(`/discipline/notices/${id}`);
  },
  create(payload: CreateDisciplineNoticeDto) {
    return apiRequest<DisciplineNoticeResponseDto>('/discipline/notices', { method: 'POST', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/notices/${id}`, { method: 'DELETE' });
  },
};

