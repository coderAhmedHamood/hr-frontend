import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { AppealChannelDto, AppealStatusDto, DisciplineAppealResponseDto, CreateDisciplineAppealDto, UpdateDisciplineAppealDto, ProcessDisciplineAppealDecisionDto, DisciplineAppealListQuery } from '@/features/hr/discipline/types/api/discipline-appeals';
export type { AppealChannelDto, AppealStatusDto, DisciplineAppealResponseDto, CreateDisciplineAppealDto, UpdateDisciplineAppealDto, ProcessDisciplineAppealDecisionDto, DisciplineAppealListQuery } from '@/features/hr/discipline/types/api/discipline-appeals';





/** POST /discipline/appeals/{id}/decision — accept / reject / under review / withdraw. */


export const disciplineAppealsApi = {
  getAll(query?: DisciplineAppealListQuery) {
    return apiRequest<PaginatedResult<DisciplineAppealResponseDto>>('/discipline/appeals', { query });
  },
  getById(id: string) {
    return apiRequest<DisciplineAppealResponseDto>(`/discipline/appeals/${id}`);
  },
  create(payload: CreateDisciplineAppealDto) {
    return apiRequest<DisciplineAppealResponseDto>('/discipline/appeals', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateDisciplineAppealDto) {
    return apiRequest<DisciplineAppealResponseDto>(`/discipline/appeals/${id}`, { method: 'PATCH', body: payload });
  },
  decide(id: string, payload: ProcessDisciplineAppealDecisionDto) {
    return apiRequest<DisciplineAppealResponseDto>(`/discipline/appeals/${id}/decision`, {
      method: 'POST',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/appeals/${id}`, { method: 'DELETE' });
  },
};

