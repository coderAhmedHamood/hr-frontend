import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  CreateRecruitmentApplicantDto,
  CreateRecruitmentJobDto,
  ListRecruitmentApplicantsQuery,
  ListRecruitmentJobsQuery,
  ListPublicRecruitmentJobsQuery,
  MoveApplicantStageDto,
  PublicRecruitmentJob,
  RecruitmentApplicant,
  RecruitmentApplicantScore,
  RecruitmentForm,
  RecruitmentJob,
  RecruitmentJobDetail,
  RecruitmentJobStats,
  RecruitmentPipelineStage,
  RecruitmentPipelineStageConfig,
  SubmitRecruitmentApplicationDto,
  UpdateRecruitmentApplicantDto,
  UpdateRecruitmentFormDto,
  UpdateRecruitmentJobDto,
  UpdateRecruitmentPipelineStagesDto,
} from '@/features/hr/recruitment/lib/api/types';

type QueryRecord = Record<string, string | number | boolean | null | undefined>;

function asQuery(query: object): QueryRecord {
  return query as QueryRecord;
}

export const recruitmentApi = {
  listJobs(query?: ListRecruitmentJobsQuery) {
    return apiRequest<PaginatedResult<RecruitmentJob>>('/recruitment/jobs', {
      query: asQuery(query ?? {}),
    });
  },

  getJob(id: string) {
    return apiRequest<RecruitmentJobDetail>(`/recruitment/jobs/${id}`);
  },

  getJobBySlug(slug: string) {
    return apiRequest<RecruitmentJobDetail>(`/recruitment/jobs/by-slug/${slug}`);
  },

  createJob(dto: CreateRecruitmentJobDto) {
    return apiRequest<RecruitmentJobDetail>('/recruitment/jobs', { method: 'POST', body: dto });
  },

  updateJob(id: string, dto: UpdateRecruitmentJobDto) {
    return apiRequest<RecruitmentJobDetail>(`/recruitment/jobs/${id}`, { method: 'PATCH', body: dto });
  },

  deleteJob(id: string) {
    return apiRequest<void>(`/recruitment/jobs/${id}`, { method: 'DELETE' });
  },

  toggleJobActive(id: string) {
    return apiRequest<RecruitmentJobDetail>(`/recruitment/jobs/${id}/toggle-active`, { method: 'PATCH' });
  },

  getFormByJobId(jobId: string) {
    return apiRequest<RecruitmentForm>(`/recruitment/jobs/${jobId}/form`);
  },

  updateFormByJobId(jobId: string, dto: UpdateRecruitmentFormDto) {
    return apiRequest<RecruitmentForm>(`/recruitment/jobs/${jobId}/form`, { method: 'PATCH', body: dto });
  },

  getJobApplicants(jobId: string, query?: Omit<ListRecruitmentApplicantsQuery, 'jobId'>) {
    return apiRequest<RecruitmentApplicant[]>(`/recruitment/jobs/${jobId}/applicants`, {
      query: asQuery({ ...query, jobId }),
    });
  },

  getJobStats(jobId: string) {
    return apiRequest<RecruitmentJobStats>(`/recruitment/jobs/${jobId}/stats`);
  },

  getJobPipeline(jobId: string) {
    return apiRequest<Record<RecruitmentPipelineStage, RecruitmentApplicant[]>>(
      `/recruitment/jobs/${jobId}/pipeline`,
    );
  },

  listJobPipelineStages(jobId: string) {
    return apiRequest<RecruitmentPipelineStageConfig[]>(`/recruitment/jobs/${jobId}/pipeline-stages`);
  },

  updateJobPipelineStages(jobId: string, dto: UpdateRecruitmentPipelineStagesDto) {
    return apiRequest<RecruitmentPipelineStageConfig[]>(`/recruitment/jobs/${jobId}/pipeline-stages`, {
      method: 'PUT',
      body: dto,
    });
  },

  listApplicants(query?: ListRecruitmentApplicantsQuery) {
    return apiRequest<PaginatedResult<RecruitmentApplicant>>('/recruitment/applicants', {
      query: asQuery(query ?? {}),
    });
  },

  createApplicant(dto: CreateRecruitmentApplicantDto) {
    return apiRequest<RecruitmentApplicant>('/recruitment/applicants', { method: 'POST', body: dto });
  },

  getApplicant(id: string) {
    return apiRequest<RecruitmentApplicant>(`/recruitment/applicants/${id}`);
  },

  updateApplicant(id: string, dto: UpdateRecruitmentApplicantDto) {
    return apiRequest<RecruitmentApplicant>(`/recruitment/applicants/${id}`, { method: 'PATCH', body: dto });
  },

  deleteApplicant(id: string) {
    return apiRequest<void>(`/recruitment/applicants/${id}`, { method: 'DELETE' });
  },

  moveApplicantStage(id: string, dto: MoveApplicantStageDto) {
    return apiRequest<RecruitmentApplicant>(`/recruitment/applicants/${id}/stage`, {
      method: 'PATCH',
      body: dto,
    });
  },

  scoreApplicant(id: string) {
    return apiRequest<RecruitmentApplicantScore>(`/recruitment/applicants/${id}/score`, {
      method: 'POST',
    });
  },
};

export const publicRecruitmentApi = {
  listActiveJobs(query?: ListPublicRecruitmentJobsQuery) {
    return apiRequest<PaginatedResult<RecruitmentJob>>('/public/recruitment/jobs', {
      query: asQuery(query ?? {}),
    });
  },

  getPublicJob(slug: string) {
    return apiRequest<PublicRecruitmentJob>(`/public/recruitment/jobs/${slug}`);
  },

  submitApplication(slug: string, dto: SubmitRecruitmentApplicationDto) {
    return apiRequest<RecruitmentApplicant>(`/public/recruitment/jobs/${slug}/apply`, {
      method: 'POST',
      body: dto,
    });
  },
};
