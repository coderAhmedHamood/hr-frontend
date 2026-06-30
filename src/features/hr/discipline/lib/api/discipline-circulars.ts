import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { CircularAudienceTypeDto, DisciplineCircularResponseDto, CreateDisciplineCircularDto, UpdateDisciplineCircularDto, DisciplineCircularListQuery, DisciplineCircularRecipientListQuery, DisciplineCircularRecipientResponseDto } from '@/features/hr/discipline/types/api/discipline-circulars';
export type { CircularAudienceTypeDto, DisciplineCircularResponseDto, CreateDisciplineCircularDto, UpdateDisciplineCircularDto, DisciplineCircularListQuery, DisciplineCircularRecipientListQuery, DisciplineCircularRecipientResponseDto } from '@/features/hr/discipline/types/api/discipline-circulars';








export const disciplineCircularsApi = {
  getAll(query?: DisciplineCircularListQuery) {
    return apiRequest<PaginatedResult<DisciplineCircularResponseDto>>('/discipline/circulars', { query });
  },
  getById(id: string) {
    return apiRequest<DisciplineCircularResponseDto>(`/discipline/circulars/${id}`);
  },
  create(payload: CreateDisciplineCircularDto) {
    return apiRequest<DisciplineCircularResponseDto>('/discipline/circulars', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateDisciplineCircularDto) {
    return apiRequest<DisciplineCircularResponseDto>(`/discipline/circulars/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/circulars/${id}`, { method: 'DELETE' });
  },
  send(id: string) {
    return apiRequest<DisciplineCircularResponseDto>(`/discipline/circulars/${id}/send`, {
      method: 'POST',
    });
  },
  getRecipients(id: string, query?: DisciplineCircularRecipientListQuery) {
    return apiRequest<PaginatedResult<DisciplineCircularRecipientResponseDto>>(
      `/discipline/circulars/${id}/recipients`,
      { query },
    );
  },
  markRecipientRead(id: string, recipientId: string) {
    return apiRequest<DisciplineCircularRecipientResponseDto>(
      `/discipline/circulars/${id}/recipients/${recipientId}/read`,
      { method: 'PATCH' },
    );
  },
};

