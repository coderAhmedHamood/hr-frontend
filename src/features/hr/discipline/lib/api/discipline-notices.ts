import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type DisciplineNoticeResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  noticeKind: string;
  reasonAr: string;
  noticeDate: string;
  violationRecordId: string | null;
  linkedViolationRecordNumber: string | null;
  attachmentsNote: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplineNoticeDto = {
  companyId: string;
  employeeId: string;
  noticeKind: string;
  reasonAr: string;
  noticeDate: string;
  violationRecordId?: string | null;
  linkedViolationRecordNumber?: string | null;
  attachmentsNote?: string | null;
  createdBy?: string | null;
};

export type DisciplineNoticeListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
};

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
