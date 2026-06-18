import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type AppealChannelDto = 'in_person' | 'written' | 'email' | 'phone' | 'system';
export type AppealStatusDto = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

export type DisciplineAppealResponseDto = {
  id: string;
  companyId: string;
  violationRecordId: string;
  linkedViolationRecordNumber: string;
  subjectEmployeeId: string;
  appealDate: string;
  groundsAr: string;
  status: AppealStatusDto;
  channel: AppealChannelDto | null;
  responseNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplineAppealDto = {
  companyId: string;
  violationRecordId?: string;
  linkedViolationRecordNumber?: string;
  appealDate: string;
  groundsAr: string;
  channel?: AppealChannelDto;
  status?: AppealStatusDto;
  createdBy?: string | null;
};

export type UpdateDisciplineAppealDto = {
  appealDate?: string;
  groundsAr?: string;
  channel?: AppealChannelDto | null;
  responseNote?: string | null;
  updatedBy?: string | null;
};

/** POST /discipline/appeals/{id}/decision — accept / reject / under review / withdraw. */
export type ProcessDisciplineAppealDecisionDto = {
  status: Exclude<AppealStatusDto, 'pending'>;
  responseNote?: string | null;
  decidedBy?: string | null;
};

export type DisciplineAppealListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  violationRecordId?: string;
  subjectEmployeeId?: string;
  status?: AppealStatusDto;
};

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
