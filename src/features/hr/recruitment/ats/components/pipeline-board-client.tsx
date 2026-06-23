'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useRecruitmentApplicantsList,
  useRecruitmentJobFormsMap,
  useRecruitmentJobPipeline,
  useRecruitmentJobsList,
  useRecruitmentMutations,
} from '@/features/hr/recruitment/hooks/useRecruitment';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';
import { getApplicantName, getInitials } from '@/features/hr/recruitment/lib/ats/utils';
import { ATS_STAGE_BADGE, ATS_STAGE_LABELS, scoreBarTone } from '@/features/hr/recruitment/lib/ats/stage-styles';
import { statusDotClass } from '@/shared/status-pill-classes';
import { RecruitmentJobNav } from '@/features/hr/recruitment/ats/components/recruitment-job-nav';

interface StageConfig {
  label: string;
  accent: string;
  pill: string;
  dot: string;
}

const STAGES: Record<AtsPipelineStage, StageConfig> = {
  applied:   { label: ATS_STAGE_LABELS.applied,   accent: 'border-t-primary/50',    pill: ATS_STAGE_BADGE.applied,   dot: statusDotClass('info') },
  screening: { label: ATS_STAGE_LABELS.screening, accent: 'border-t-primary/30',    pill: ATS_STAGE_BADGE.screening, dot: statusDotClass('calculated') },
  interview: { label: ATS_STAGE_LABELS.interview, accent: 'border-t-gold/50',       pill: ATS_STAGE_BADGE.interview, dot: statusDotClass('gold') },
  technical: { label: ATS_STAGE_LABELS.technical, accent: 'border-t-warning/50',    pill: ATS_STAGE_BADGE.technical, dot: statusDotClass('warning') },
  offer:     { label: ATS_STAGE_LABELS.offer,     accent: 'border-t-success/50',    pill: ATS_STAGE_BADGE.offer,     dot: statusDotClass('approved') },
  hired:     { label: ATS_STAGE_LABELS.hired,     accent: 'border-t-success',       pill: ATS_STAGE_BADGE.hired,     dot: statusDotClass('approved') },
  rejected:  { label: ATS_STAGE_LABELS.rejected,  accent: 'border-t-destructive/50', pill: ATS_STAGE_BADGE.rejected, dot: statusDotClass('rejected') },
};

const STAGE_ORDER = Object.keys(STAGES) as AtsPipelineStage[];

export function PipelineBoardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlJobId = searchParams.get('jobId') ?? '';

  const [jobFilter, setJobFilter] = React.useState<string>(urlJobId || 'all');
  const { moveApplicantStage: moveStageMutation } = useRecruitmentMutations();
  const { data: jobsData } = useRecruitmentJobsList();
  const jobs = jobsData?.jobs ?? [];
  const { formById } = useRecruitmentJobFormsMap(jobs.map((j) => j.id));

  const { data: allApplicants = [] } = useRecruitmentApplicantsList(
    jobFilter === 'all' ? {} : { jobId: jobFilter },
  );
  const { data: pipelineByJob } = useRecruitmentJobPipeline(
    jobFilter !== 'all' ? jobFilter : undefined,
  );

  React.useEffect(() => {
    if (urlJobId) setJobFilter(urlJobId);
  }, [urlJobId]);

  const applicantsByStage = React.useMemo(() => {
    if (jobFilter !== 'all' && pipelineByJob) {
      return pipelineByJob;
    }
    const grouped = {
      applied: [],
      screening: [],
      interview: [],
      technical: [],
      offer: [],
      hired: [],
      rejected: [],
    } as Record<AtsPipelineStage, typeof allApplicants>;
    for (const app of allApplicants) {
      grouped[app.pipelineStage]?.push(app);
    }
    return grouped;
  }, [allApplicants, jobFilter, pipelineByJob]);

  const updateJobFilter = (value: string) => {
    setJobFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') params.delete('jobId');
    else params.set('jobId', value);
    const qs = params.toString();
    router.replace(qs ? `/hr/recruitment/ats-pipeline?${qs}` : '/hr/recruitment/ats-pipeline');
  };

  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropStage, setDropStage] = React.useState<AtsPipelineStage | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, stage: AtsPipelineStage) => {
    e.preventDefault();
    setDropStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, stage: AtsPipelineStage) => {
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
  };

  const handleDragEnd = () => { setDraggingId(null); setDropStage(null); };

  const selectedJob = jobFilter !== 'all' ? jobs.find((j) => j.id === jobFilter) : undefined;

  return (
    <div className="space-y-4 animate-fade-in">
      <RecruitmentJobNav
        jobId={jobFilter !== 'all' ? jobFilter : undefined}
        active="pipeline"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">مسار التوظيف</h2>
          <p className="text-xs text-muted-foreground">
            {selectedJob
              ? `متابعة متقدمين: ${selectedJob.title}`
              : 'اسحب البطاقات بين الأعمدة لتحديث المرحلة'}
          </p>
        </div>
        <Select value={jobFilter} onValueChange={updateJobFilter}>
          <SelectTrigger className="h-9 w-full text-xs sm:w-56">
            <SelectValue placeholder="تصفية حسب الوظيفة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الوظائف</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Board — horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {STAGE_ORDER.map((stage) => {
            const cfg = STAGES[stage];
            const stageApps = applicantsByStage[stage] ?? [];
            const isDropTarget = dropStage === stage && draggingId !== null;

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDrop={(e) => handleDrop(e, stage)}
                onDragLeave={() => setDropStage(null)}
                className={`flex w-52 shrink-0 flex-col rounded-xl border-t-2 bg-muted/30 transition-all ${cfg.accent} ${isDropTarget ? 'ring-2 ring-primary/30 bg-primary/5' : ''}`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className="text-xs font-semibold">{cfg.label}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.pill}`}>
                    {stageApps.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2 p-2 min-h-48">
                  {stageApps.map((app) => {
                    const form = formById.get(app.formId);
                    const name = form ? getApplicantName(app, form.fields) : 'متقدم';
                    const initials = getInitials(name);
                    const jobTitle = jobs.find((j) => j.id === app.jobId)?.title;
                    const isDragging = draggingId === app.id;

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (jobFilter !== 'all') params.set('jobId', jobFilter);
                          else params.set('jobId', app.jobId);
                          params.set('detail', app.id);
                          router.push(`/hr/recruitment/ats-applicants?${params.toString()}`);
                        }}
                        className={`group rounded-lg border border-border bg-card px-3 py-2.5 shadow-soft transition-all select-none cursor-pointer
                          ${isDragging ? 'opacity-30 scale-95 rotate-1' : 'hover:shadow-elevated hover:-translate-y-px'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold leading-tight">{name}</p>
                            {jobFilter === 'all' && jobTitle && (
                              <p className="truncate text-[10px] text-muted-foreground">{jobTitle}</p>
                            )}
                          </div>
                        </div>
                        {app.score ? (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${scoreBarTone(app.score.finalScore).bar}`}
                                style={{ width: `${app.score.finalScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{app.score.finalScore}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {stageApps.length === 0 && !isDropTarget && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/50 py-6">
                      <Users className="h-4 w-4 text-muted-foreground/20" />
                      <span className="text-[10px] text-muted-foreground/40">أفلت هنا</span>
                    </div>
                  )}
                  {isDropTarget && (
                    <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 py-6">
                      <span className="text-[10px] font-medium text-primary">أفلت هنا</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
