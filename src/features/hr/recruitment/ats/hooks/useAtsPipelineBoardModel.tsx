'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import type { AtsApplicant } from '@/features/hr/recruitment/lib/ats/types';
import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';
import {
  RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
  RECRUITMENT_ARCHIVE_SCOPE_OPTIONS,
} from '@/features/hr/recruitment/lib/archive-scope';
import type { RecruitmentArchiveScope } from '@/features/hr/recruitment/lib/api/types';
import { ATS_PIPELINE_STAGE_ORDER } from '@/features/hr/recruitment/ats/constants/ats-pipeline-board';
import {
  useRecruitmentApplicantsList,
  useRecruitmentJobFormsMap,
  useRecruitmentJobsList,
  useRecruitmentMutations,
} from '@/features/hr/recruitment/hooks/useRecruitment';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';
import { ATS_STAGE_LABELS } from '@/features/hr/recruitment/lib/ats/stage-styles';

function emptyStageGroups(): Record<AtsPipelineStage, AtsApplicant[]> {
  return {
    applied: [],
    screening: [],
    interview: [],
    technical: [],
    offer: [],
    hired: [],
    rejected: [],
  };
}

export function useAtsPipelineBoardModel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlJobId = searchParams.get('jobId') ?? '';

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [jobFilter, setJobFilter] = React.useState(urlJobId || 'all');
  const [archiveScope, setArchiveScope] = React.useState<RecruitmentArchiveScope>(
    RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
  );
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropStage, setDropStage] = React.useState<AtsPipelineStage | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    if (urlJobId) setJobFilter(urlJobId);
  }, [urlJobId]);

  const { moveApplicantStage: moveStageMutation } = useRecruitmentMutations();
  const { data: jobsData, isLoading: jobsLoading } = useRecruitmentJobsList(
    undefined,
    RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
  );
  const jobs = jobsData?.jobs ?? [];
  const { formById } = useRecruitmentJobFormsMap(jobs.map((j) => j.id));

  const jobSelectOptions = React.useMemo(
    () => [
      { value: 'all', label: 'جميع الوظائف' },
      ...jobs.map((j) => ({ value: j.id, label: j.title })),
    ],
    [jobs],
  );

  const { data: applicants = [], isLoading: applicantsLoading } = useRecruitmentApplicantsList({
    jobId: jobFilter !== 'all' ? jobFilter : undefined,
    search: debouncedSearch.trim() || undefined,
    archiveScope,
  });

  const applicantsByStage = React.useMemo(() => {
    const grouped = emptyStageGroups();
    for (const app of applicants) {
      grouped[app.pipelineStage]?.push(app);
    }
    return grouped;
  }, [applicants]);

  const totalApplicants = applicants.length;
  const selectedJob = jobFilter !== 'all' ? jobs.find((j) => j.id === jobFilter) : undefined;

  const activeFilterCount =
    (search.trim() ? 1 : 0)
    + (jobFilter !== 'all' ? 1 : 0)
    + (archiveScope !== RECRUITMENT_ARCHIVE_SCOPE_DEFAULT ? 1 : 0);

  const updateJobFilter = React.useCallback((value: string) => {
    setJobFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('jobId');
    else params.set('jobId', value);
    const qs = params.toString();
    router.replace(qs ? `/hr/recruitment/ats-pipeline?${qs}` : '/hr/recruitment/ats-pipeline');
  }, [router, searchParams]);

  const openApplicantDetail = React.useCallback((applicantId: string, applicantJobId: string) => {
    const params = new URLSearchParams();
    params.set('jobId', jobFilter !== 'all' ? jobFilter : applicantJobId);
    params.set('detail', applicantId);
    router.push(`/hr/recruitment/ats-applicants?${params.toString()}`);
  }, [router, jobFilter]);

  const handleDragStart = React.useCallback((e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent, stage: AtsPipelineStage) => {
    e.preventDefault();
    setDropStage(stage);
  }, []);

  const handleDrop = React.useCallback(async (e: React.DragEvent, stage: AtsPipelineStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      try {
        await moveStageMutation.mutateAsync({ id, dto: { pipelineStage: stage } });
        toast.success(`تم نقل المتقدم إلى: ${ATS_STAGE_LABELS[stage]}`);
      } catch (err) {
        const { displayMessage } = handleApiError(err, 'recruitment.applicants.stage');
        toast.error(displayMessage);
      }
    }
    setDraggingId(null);
    setDropStage(null);
  }, [moveStageMutation]);

  const handleDragEnd = React.useCallback(() => {
    setDraggingId(null);
    setDropStage(null);
  }, []);

  const clearDropStage = React.useCallback(() => setDropStage(null), []);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
      </div>
    ),
    [activeFilterCount],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={(
          <EntityFilterSearchField
            value={search}
            onChange={setSearch}
            placeholder="بحث باسم المتقدم…"
          />
        )}
        inlineSelects={[
          {
            id: 'job',
            value: jobFilter,
            onChange: updateJobFilter,
            placeholder: 'الوظيفة',
            options: jobSelectOptions,
            className: 'w-[11rem] max-w-[11rem]',
          },
          {
            id: 'archive',
            value: archiveScope,
            onChange: (v) => setArchiveScope(v as RecruitmentArchiveScope),
            placeholder: 'العرض',
            options: RECRUITMENT_ARCHIVE_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          },
        ]}
        onDateBoundsChange={() => {}}
      />
    ),
    [search, jobFilter, archiveScope, jobSelectOptions, updateJobFilter],
  );

  return {
    jobFilter,
    jobs,
    formById,
    applicantsByStage,
    totalApplicants,
    selectedJob,
    loading: jobsLoading || applicantsLoading,
    draggingId,
    dropStage,
    stageOrder: ATS_PIPELINE_STAGE_ORDER,
    openApplicantDetail,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    clearDropStage,
    isMoving: moveStageMutation.isPending,
  };
}

export type AtsPipelineBoardModel = ReturnType<typeof useAtsPipelineBoardModel>;
