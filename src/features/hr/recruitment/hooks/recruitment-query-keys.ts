import type { ListRecruitmentApplicantsQuery } from '@/features/hr/recruitment/lib/api/types';

export const recruitmentKeys = {
  all: ['recruitment'] as const,
  jobs: (search?: string, archiveScope?: string) =>
    [...recruitmentKeys.all, 'jobs', search ?? '', archiveScope ?? 'active'] as const,
  job: (id: string) => [...recruitmentKeys.all, 'job', id] as const,
  jobForm: (jobId: string) => [...recruitmentKeys.all, 'job-form', jobId] as const,
  jobStats: (id: string) => [...recruitmentKeys.all, 'job-stats', id] as const,
  jobPipeline: (id: string) => [...recruitmentKeys.all, 'job-pipeline', id] as const,
  applicants: (filters: ListRecruitmentApplicantsQuery) =>
    [...recruitmentKeys.all, 'applicants', filters] as const,
  applicant: (id: string) => [...recruitmentKeys.all, 'applicant', id] as const,
  pipelineStages: (jobId: string) => [...recruitmentKeys.all, 'pipeline-stages', jobId] as const,
  publicJob: (slug: string) => [...recruitmentKeys.all, 'public-job', slug] as const,
  publicJobs: (search?: string) => [...recruitmentKeys.all, 'public-jobs', search ?? ''] as const,
};
