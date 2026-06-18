'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Star, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtsStore } from '@/features/hr/recruitment/lib/ats/store';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';
import { getApplicantName, getInitials } from '@/features/hr/recruitment/lib/ats/utils';
import { ATS_STAGE_BADGE, ATS_STAGE_TABS, scoreBarTone, type AtsStageTab } from '@/features/hr/recruitment/lib/ats/stage-styles';
import { DisplayDate } from '@/components/ui/table-cells';

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
  const { getTenantJobs, getTenantApplicants, getTenantForms } = useAtsStore();
  const jobs = getTenantJobs();
  const applicants = getTenantApplicants();
  const forms = getTenantForms();

  const [search, setSearch] = React.useState('');
  const [stageTab, setStageTab] = React.useState<StageTab>('all');
  const [jobFilter, setJobFilter] = React.useState<string>('all');
  const [minScore, setMinScore] = React.useState('');

  const stageCounts = React.useMemo(() => {
    const counts: Record<StageTab, number> = { all: applicants.length, applied: 0, screening: 0, interview: 0, technical: 0, offer: 0, hired: 0, rejected: 0 };
    for (const a of applicants) counts[a.pipelineStage] = (counts[a.pipelineStage] ?? 0) + 1;
    return counts;
  }, [applicants]);

  const filtered = React.useMemo(() => applicants.filter((a) => {
    const form = forms.find((f) => f.id === a.formId);
    const name = form ? getApplicantName(a, form.fields) : '';
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) ||
      Object.values(a.answers).some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStage = stageTab === 'all' || a.pipelineStage === stageTab;
    const matchJob = jobFilter === 'all' || a.jobId === jobFilter;
    const matchScore = !minScore || (a.score?.finalScore ?? 0) >= Number(minScore);
    return matchSearch && matchStage && matchJob && matchScore;
  }), [applicants, forms, search, stageTab, jobFilter, minScore]);

  const stageLabel = STAGES.find((s) => s.key === stageTab)?.label ?? '';
  const hasActiveFilter = stageTab !== 'all' || jobFilter !== 'all' || !!minScore || !!search;

  const activeFilterCount = (stageTab !== 'all' ? 1 : 0) + (jobFilter !== 'all' ? 1 : 0) + (!!minScore ? 1 : 0) + (!!search ? 1 : 0);

  usePageHeaderActions(
    () => <FilterToggleButton activeFilterCount={activeFilterCount} />,
    [activeFilterCount],
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
          <Select value={jobFilter} onValueChange={setJobFilter}>
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
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground shrink-0"
              onClick={() => { setStageTab('all'); setJobFilter('all'); setMinScore(''); setSearch(''); }}>
              <X className="h-3.5 w-3.5" /> مسح
            </Button>
          )}
        </div>
      </div>
    ),
    [search, stageTab, jobFilter, minScore, stageCounts, jobs, hasActiveFilter],
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Cards grid */}
      {filtered.length === 0 ? (
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
            const form = forms.find((f) => f.id === app.formId);
            const name = form ? getApplicantName(app, form.fields) : 'متقدم';
            const initials = getInitials(name);
            const stageCfg = STAGES.find((s) => s.key === app.pipelineStage);
            return (
              <Card
                key={app.id}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-elevated hover:-translate-y-px"
                onClick={() => router.push(`/hr/recruitment/ats-applicants?detail=${app.id}`)}
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
                    <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 ${STAGE_BADGE[app.pipelineStage]}`}>
                      {stageCfg?.label}
                    </Badge>
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
    </div>
  );
}
