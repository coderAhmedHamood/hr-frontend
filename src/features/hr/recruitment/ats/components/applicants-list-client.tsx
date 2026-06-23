'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Users, Star, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';
import { getApplicantName, getInitials } from '@/features/hr/recruitment/lib/ats/utils';
import { ATS_STAGE_BADGE, ATS_STAGE_TABS, scoreBarTone, type AtsStageTab } from '@/features/hr/recruitment/lib/ats/stage-styles';
import { DisplayDate } from '@/components/ui/table-cells';
import { RecruitmentJobNav } from '@/features/hr/recruitment/ats/components/recruitment-job-nav';
import { AtsApplicantDetailDialog } from '@/features/hr/recruitment/ats/components/ats-applicant-detail-dialog';
import {
  useRecruitmentApplicant,
  useRecruitmentApplicantsList,
  useRecruitmentJobDetail,
  useRecruitmentJobFormsMap,
  useRecruitmentJobsList,
} from '@/features/hr/recruitment/hooks/useRecruitment';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { ArchiveScopeToggleButton } from '@/components/layouts/archive-scope-toggle-button';
import {
  RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
  RECRUITMENT_ARCHIVE_SCOPE_OPTIONS,
} from '@/features/hr/recruitment/lib/archive-scope';
import type { RecruitmentArchiveScope } from '@/features/hr/recruitment/lib/api/types';

/* ─── Stage config ────────────────────────────────────────────── */
type StageTab = AtsStageTab;

const STAGES = ATS_STAGE_TABS;
const STAGE_BADGE = ATS_STAGE_BADGE;

/* ─── Score bar ───────────────────────────────────────────────── */
function ScoreBar({ score }: { score: number }) {
  const { bar, text } = scoreBarTone(score);
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[10px] font-bold tabular-nums ${text}`}>{score}</span>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export function ApplicantsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlJobId = searchParams.get('jobId') ?? '';
  const detailId = searchParams.get('detail') ?? '';

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [stageTab, setStageTab] = React.useState<StageTab>('all');
  const [jobFilter, setJobFilter] = React.useState<string>(urlJobId || 'all');
  const [minScore, setMinScore] = React.useState('');
  const [maxScore, setMaxScore] = React.useState('');
  const [submittedFrom, setSubmittedFrom] = React.useState('');
  const [submittedTo, setSubmittedTo] = React.useState('');
  const [archiveScope, setArchiveScope] = React.useState<RecruitmentArchiveScope>(
    RECRUITMENT_ARCHIVE_SCOPE_DEFAULT,
  );

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    if (urlJobId) setJobFilter(urlJobId);
  }, [urlJobId]);

  const { data: jobsData } = useRecruitmentJobsList(undefined, RECRUITMENT_ARCHIVE_SCOPE_DEFAULT);
  const jobs = jobsData?.jobs ?? [];
  const { formById } = useRecruitmentJobFormsMap(jobs.map((j) => j.id));

  const listQuery = React.useMemo(() => ({
    jobId: jobFilter !== 'all' ? jobFilter : undefined,
    pipelineStage: stageTab !== 'all' ? (stageTab as AtsPipelineStage) : undefined,
    minScore: minScore ? Number(minScore) : undefined,
    maxScore: maxScore ? Number(maxScore) : undefined,
    submittedFrom: submittedFrom || undefined,
    submittedTo: submittedTo || undefined,
    search: debouncedSearch || undefined,
    archiveScope,
  }), [jobFilter, stageTab, minScore, maxScore, submittedFrom, submittedTo, debouncedSearch, archiveScope]);

  const { data: applicants = [], isLoading } = useRecruitmentApplicantsList(listQuery);
  const { data: detailApplicantFromApi } = useRecruitmentApplicant(detailId || undefined);
  const detailApplicant = detailApplicantFromApi ?? applicants.find((a) => a.id === detailId);
  const { data: detailJobData } = useRecruitmentJobDetail(detailApplicant?.jobId);
  const detailForm = detailJobData?.form ?? (detailApplicant ? formById.get(detailApplicant.formId) : undefined);

  const updateJobFilter = (value: string) => {
    setJobFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('jobId');
    else params.set('jobId', value);
    params.delete('detail');
    const qs = params.toString();
    router.replace(qs ? `/hr/recruitment/ats-applicants?${qs}` : '/hr/recruitment/ats-applicants');
  };

  const openApplicantDetail = (applicantId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('detail', applicantId);
    if (jobFilter !== 'all') params.set('jobId', jobFilter);
    router.replace(`/hr/recruitment/ats-applicants?${params.toString()}`);
  };

  const closeApplicantDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('detail');
    const qs = params.toString();
    router.replace(qs ? `/hr/recruitment/ats-applicants?${qs}` : '/hr/recruitment/ats-applicants');
  };

  const stageCounts = React.useMemo(() => {
    const counts: Record<StageTab, number> = { all: applicants.length, applied: 0, screening: 0, interview: 0, technical: 0, offer: 0, hired: 0, rejected: 0 };
    for (const a of applicants) counts[a.pipelineStage] = (counts[a.pipelineStage] ?? 0) + 1;
    return counts;
  }, [applicants]);

  const filtered = applicants;

  const stageLabel = STAGES.find((s) => s.key === stageTab)?.label ?? '';
  const hasActiveFilter = stageTab !== 'all' || jobFilter !== 'all' || !!minScore || !!maxScore
    || !!search || !!submittedFrom || !!submittedTo || archiveScope !== 'active';

  const activeFilterCount = (stageTab !== 'all' ? 1 : 0) + (jobFilter !== 'all' ? 1 : 0)
    + (!!minScore ? 1 : 0) + (!!maxScore ? 1 : 0) + (!!search ? 1 : 0)
    + ((!!submittedFrom || !!submittedTo) ? 1 : 0) + (archiveScope !== 'active' ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <ArchiveScopeToggleButton scope={archiveScope} onScopeChange={setArchiveScope} />
        <FilterToggleButton activeFilterCount={activeFilterCount} />
      </div>
    ),
    [archiveScope, activeFilterCount],
  );

  useEntityFilterSlot(
    () => (
      <div className="rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 shadow-sm backdrop-blur-sm sm:px-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map(({ key, label, pill, dot }) => {
            const count = stageCounts[key] ?? 0;
            const active = stageTab === key;
            return (
              <button
                key={key}
                data-active={active}
                onClick={() => setStageTab(key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all duration-100 border-transparent ${pill} ${active ? 'font-semibold ring-2 ring-offset-1 ring-offset-background' : 'hover:opacity-80'}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${dot} ${active ? '' : 'opacity-60'}`} />
                {label}
                <span className="rounded bg-white/60 px-1.5 py-px font-mono text-[10px] tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="بحث بالاسم…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pr-8 text-xs" />
          </div>
          <Select value={jobFilter} onValueChange={updateJobFilter}>
            <SelectTrigger className="h-8 w-full text-xs sm:w-44"><SelectValue placeholder="الوظيفة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الوظائف</SelectItem>
              {jobs.map((j) => (<SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-24">
            <Star className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gold" />
            <Input type="number" min={0} max={100} placeholder="نقاط ≥" value={minScore} onChange={(e) => setMinScore(e.target.value)} className="h-8 pr-7 text-xs" />
          </div>
          <div className="relative w-full sm:w-24">
            <Star className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input type="number" min={0} max={100} placeholder="نقاط ≤" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="h-8 pr-7 text-xs" />
          </div>
          <Input type="date" value={submittedFrom} onChange={(e) => setSubmittedFrom(e.target.value)} className="h-8 w-full text-xs sm:w-36" title="من تاريخ التقديم" />
          <Input type="date" value={submittedTo} onChange={(e) => setSubmittedTo(e.target.value)} className="h-8 w-full text-xs sm:w-36" title="إلى تاريخ التقديم" />
          <Select value={archiveScope} onValueChange={(v) => setArchiveScope(v as RecruitmentArchiveScope)}>
            <SelectTrigger className="h-8 w-full text-xs sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RECRUITMENT_ARCHIVE_SCOPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground shrink-0"
              onClick={() => {
                setStageTab('all');
                setJobFilter('all');
                setMinScore('');
                setMaxScore('');
                setSubmittedFrom('');
                setSubmittedTo('');
                setSearch('');
                setArchiveScope('active');
              }}>
              <X className="h-3.5 w-3.5" /> مسح
            </Button>
          )}
        </div>
      </div>
    ),
    [search, stageTab, jobFilter, minScore, maxScore, submittedFrom, submittedTo, archiveScope, stageCounts, jobs, hasActiveFilter],
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <RecruitmentJobNav
        jobId={jobFilter !== 'all' ? jobFilter : undefined}
        active="applicants"
      />

      {/* Cards grid */}
      {isLoading ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">جاري التحميل…</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Users className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">لا يوجد متقدمون في {stageLabel}</p>
            <p className="text-xs text-muted-foreground">جرّب تغيير معايير التصفية</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => {
            const job = jobs.find((j) => j.id === app.jobId);
            const form = formById.get(app.formId);
            const name = form ? getApplicantName(app, form.fields) : 'متقدم';
            const initials = getInitials(name);
            const stageCfg = STAGES.find((s) => s.key === app.pipelineStage);
            return (
              <Card
                key={app.id}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-elevated hover:-translate-y-px"
                onClick={() => openApplicantDetail(app.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight">{name}</p>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">{job?.title ?? '—'}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STAGE_BADGE[app.pipelineStage]}`}>
                        {stageCfg?.label}
                      </Badge>
                      {app.isArchived && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-700 border-amber-500/40">
                          مؤرشف
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <DisplayDate value={app.submittedAt} mode="datetime" className="text-[11px]" />
                    </div>
                    {app.score ? (
                      <ScoreBar score={app.score.finalScore} />
                    ) : (
                      <span className="text-[11px] text-muted-foreground/30">بدون تقييم</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AtsApplicantDetailDialog
        applicant={detailApplicant ?? null}
        form={detailForm}
        open={!!detailId && !!detailApplicant}
        onOpenChange={(open) => { if (!open) closeApplicantDetail(); }}
      />
    </div>
  );
}
