'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPublicCareersJobs } from '@/features/hr/recruitment/lib/api/fetch-public-careers-jobs';
import { publicRecruitmentApi } from '@/features/hr/recruitment/lib/api/recruitment';
import { mapRecruitmentForm, mapRecruitmentJob } from '@/features/hr/recruitment/lib/api/mappers';
import { normalizeRecruitmentPaginated } from '@/features/hr/recruitment/lib/api/normalize-paginated';
import { recruitmentKeys } from '@/features/hr/recruitment/hooks/recruitment-query-keys';
import type { RecruitmentJob } from '@/features/hr/recruitment/lib/api/types';

export function usePublicRecruitmentJobsList(search?: string) {
  return useQuery({
    queryKey: recruitmentKeys.publicJobs(search),
    queryFn: async () => {
      const raw = await fetchPublicCareersJobs(search);
      const res = normalizeRecruitmentPaginated<RecruitmentJob>(raw);
      return res.items.map(mapRecruitmentJob);
    },
    staleTime: 60_000,
  });
}

export function usePublicRecruitmentJob(slug: string) {
  return useQuery({
    queryKey: recruitmentKeys.publicJob(slug),
    queryFn: async () => {
      const data = await publicRecruitmentApi.getPublicJob(slug);
      return {
        job: mapRecruitmentJob(data.job),
        form: mapRecruitmentForm(data.form),
      };
    },
    enabled: !!slug,
    retry: false,
  });
}
