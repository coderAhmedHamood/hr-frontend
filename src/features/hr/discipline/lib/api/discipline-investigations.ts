import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { InvestigationResultDto, InvestigationSubmittedResultDto, InvestigationRecommendationDto, InvestigationDeductionTypeDto, DisciplineInvestigationResponseDto, CreateDisciplineInvestigationDto, SubmitDisciplineInvestigationResultsDto, CreateDisciplineInvestigationWithResultsDto, UpdateDisciplineInvestigationDto, DisciplineInvestigationListQuery } from '@/features/hr/discipline/types/api/discipline-investigations';
export type { InvestigationResultDto, InvestigationSubmittedResultDto, InvestigationRecommendationDto, InvestigationDeductionTypeDto, DisciplineInvestigationResponseDto, CreateDisciplineInvestigationDto, SubmitDisciplineInvestigationResultsDto, CreateDisciplineInvestigationWithResultsDto, UpdateDisciplineInvestigationDto, DisciplineInvestigationListQuery } from '@/features/hr/discipline/types/api/discipline-investigations';



/** Opens an investigation record linked to a violation case. */

/** POST /discipline/investigations/{id}/results — submit findings on an existing record. */




export const disciplineInvestigationsApi = {
  getAll(query?: DisciplineInvestigationListQuery) {
    return apiRequest<PaginatedResult<DisciplineInvestigationResponseDto>>('/discipline/investigations', { query });
  },
  getById(id: string) {
    return apiRequest<DisciplineInvestigationResponseDto>(`/discipline/investigations/${id}`);
  },
  create(payload: CreateDisciplineInvestigationDto) {
    return apiRequest<DisciplineInvestigationResponseDto>('/discipline/investigations', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateDisciplineInvestigationDto) {
    return apiRequest<DisciplineInvestigationResponseDto>(`/discipline/investigations/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  submitResults(id: string, payload: SubmitDisciplineInvestigationResultsDto) {
    return apiRequest<DisciplineInvestigationResponseDto>(`/discipline/investigations/${id}/results`, {
      method: 'POST',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/investigations/${id}`, { method: 'DELETE' });
  },
};

