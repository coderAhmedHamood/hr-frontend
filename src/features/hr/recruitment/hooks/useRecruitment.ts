'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { mapRecruitmentApplicant, mapRecruitmentForm, mapRecruitmentJob, mapRecruitmentJobDetail } from '@/features/hr/recruitment/lib/api/mappers';
import { normalizeRecruitmentPaginated } from '@/features/hr/recruitment/lib/api/normalize-paginated';
import { recruitmentKeys } from '@/features/hr/recruitment/hooks/recruitment-query-keys';
import type {
  CreateRecruitmentApplicantDto,
  CreateRecruitmentJobDto,
  ListRecruitmentApplicantsQuery,
  MoveApplicantStageDto,
  UpdateRecruitmentApplicantDto,
  UpdateRecruitmentJobDto,
  UpdateRecruitmentPipelineStagesDto,
  RecruitmentJob,
  RecruitmentApplicant,
} from '@/features/hr/recruitment/lib/api/types';
import { recruitmentApi } from '@/features/hr/recruitment/lib/api/recruitment';
import {
  RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
  recruitmentListArchiveQuery,
} from '@/features/hr/recruitment/lib/archive-scope';
import type { RecruitmentArchiveScope } from '@/features/hr/recruitment/lib/api/types';
import type { AtsForm, AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';

export function useRecruitmentJobsList(
  search?: string,
  archiveScope: RecruitmentArchiveScope = RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
) {
  return useQuery({
    queryKey: recruitmentKeys.jobs(search, archiveScope),
    queryFn: async () => {
      const raw = await recruitmentApi.listJobs({
        limit: 200,
        search,
        ...recruitmentListArchiveQuery(archiveScope),
      });
      const res = normalizeRecruitmentPaginated<RecruitmentJob>(raw);
      return {
        jobs: res.items.map((item) => mapRecruitmentJob(item)),
        pagination: res.pagination,
      };
    },
  });
}

/** Fetches application forms for jobs (list endpoint returns jobs without embedded form). */
export function useRecruitmentJobFormsMap(jobIds: string[]) {
  const stableIds = [...new Set(jobIds.filter(Boolean))].sort();
  const results = useQueries({
    queries: stableIds.map((jobId) => ({
      queryKey: recruitmentKeys.jobForm(jobId),
      queryFn: async () => mapRecruitmentForm(await recruitmentApi.getFormByJobId(jobId)),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const forms = results.map((r) => r.data).filter((f): f is AtsForm => !!f);
  const formById = new Map(forms.map((f) => [f.id, f]));
  const formByJobId = new Map(forms.map((f) => [f.jobId, f]));

  return {
    forms,
    formById,
    formByJobId,
    isLoading: results.some((r) => r.isLoading),
  };
}

export function useRecruitmentApplicantsList(query: ListRecruitmentApplicantsQuery = {}) {
  const filters: ListRecruitmentApplicantsQuery = {
    ...recruitmentListArchiveQuery(query.archiveScope ?? RECRUITMENT_ARCHIVE_SCOPE_DEFAULT),
    ...query,
  };
  return useQuery({
    queryKey: recruitmentKeys.applicants(filters),
    queryFn: async () => {
      const raw = await recruitmentApi.listApplicants({ limit: 500, ...filters });
      const res = normalizeRecruitmentPaginated<RecruitmentApplicant>(raw);
      return res.items.map(mapRecruitmentApplicant);
    },
  });
}

export function useRecruitmentJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.job(jobId ?? ''),
    queryFn: async () => mapRecruitmentJobDetail(await recruitmentApi.getJob(jobId!)),
    enabled: !!jobId,
  });
}

export function useRecruitmentJobStats(jobId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.jobStats(jobId ?? ''),
    queryFn: () => recruitmentApi.getJobStats(jobId!),
    enabled: !!jobId,
  });
}

export function useRecruitmentApplicant(applicantId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.applicant(applicantId ?? ''),
    queryFn: async () => mapRecruitmentApplicant(await recruitmentApi.getApplicant(applicantId!)),
    enabled: !!applicantId,
  });
}

export function useRecruitmentJobPipeline(jobId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.jobPipeline(jobId ?? ''),
    queryFn: async () => {
      const pipeline = await recruitmentApi.getJobPipeline(jobId!);
      const mapped: Record<string, ReturnType<typeof mapRecruitmentApplicant>[]> = {};
      for (const [stage, apps] of Object.entries(pipeline)) {
        mapped[stage] = apps.map(mapRecruitmentApplicant);
      }
      return mapped as Record<AtsPipelineStage, ReturnType<typeof mapRecruitmentApplicant>[]>;
    },
    enabled: !!jobId,
  });
}

export function useRecruitmentJobPipelineStages(jobId: string | undefined) {
  return useQuery({
    queryKey: recruitmentKeys.pipelineStages(jobId ?? ''),
    queryFn: () => recruitmentApi.listJobPipelineStages(jobId!),
    enabled: !!jobId,
  });
}

export function useRecruitmentMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: recruitmentKeys.all });
  };

  const createJob = useMutation({
    mutationFn: (dto: CreateRecruitmentJobDto) => recruitmentApi.createJob(dto),
    onSuccess: invalidateAll,
  });

  const updateJob = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecruitmentJobDto }) =>
      recruitmentApi.updateJob(id, dto),
    onSuccess: invalidateAll,
  });

  const deleteJob = useMutation({
    mutationFn: (id: string) => recruitmentApi.deleteJob(id),
    onSuccess: invalidateAll,
  });

  const toggleJobActive = useMutation({
    mutationFn: (id: string) => recruitmentApi.toggleJobActive(id),
    onSuccess: invalidateAll,
  });

  const moveApplicantStage = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: MoveApplicantStageDto }) =>
      recruitmentApi.moveApplicantStage(id, dto),
    onSuccess: invalidateAll,
  });

  const deleteApplicant = useMutation({
    mutationFn: (id: string) => recruitmentApi.deleteApplicant(id),
    onSuccess: invalidateAll,
  });

  const scoreApplicant = useMutation({
    mutationFn: (id: string) => recruitmentApi.scoreApplicant(id),
    onSuccess: invalidateAll,
  });

  const createApplicant = useMutation({
    mutationFn: (dto: CreateRecruitmentApplicantDto) => recruitmentApi.createApplicant(dto),
    onSuccess: invalidateAll,
  });

  const updateApplicant = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecruitmentApplicantDto }) =>
      recruitmentApi.updateApplicant(id, dto),
    onSuccess: invalidateAll,
  });

  const updateJobPipelineStages = useMutation({
    mutationFn: ({ jobId, dto }: { jobId: string; dto: UpdateRecruitmentPipelineStagesDto }) =>
      recruitmentApi.updateJobPipelineStages(jobId, dto),
    onSuccess: invalidateAll,
  });

  return {
    createJob,
    updateJob,
    deleteJob,
    toggleJobActive,
    createApplicant,
    updateApplicant,
    moveApplicantStage,
    deleteApplicant,
    scoreApplicant,
    updateJobPipelineStages,
  };
}
