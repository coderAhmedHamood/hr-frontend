import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type JobTitleResponseDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateJobTitleDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdateJobTitleDto = Omit<Partial<CreateJobTitleDto>, 'companyId'>;

export type JobTitleListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
};

export const jobTitlesApi = {
  getAll(query?: JobTitleListQuery) {
    return apiRequest<PaginatedResult<JobTitleResponseDto>>('/job-titles', { query });
  },
  getById(id: string) {
    return apiRequest<JobTitleResponseDto>(`/job-titles/${id}`);
  },
  create(payload: CreateJobTitleDto) {
    return apiRequest<JobTitleResponseDto>('/job-titles', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateJobTitleDto) {
    return apiRequest<JobTitleResponseDto>(`/job-titles/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/job-titles/${id}`, { method: 'DELETE' });
  },
};
