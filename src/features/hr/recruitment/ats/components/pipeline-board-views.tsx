'use client';

import * as React from 'react';
import { Briefcase, Calendar, GripVertical, Kanban, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DisplayDate } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';
import type { AtsApplicant, AtsForm, AtsJob } from '@/features/hr/recruitment/lib/ats/types';
import { getApplicantName, getInitials } from '@/features/hr/recruitment/lib/ats/utils';
import { scoreBarTone } from '@/features/hr/recruitment/lib/ats/stage-styles';
import { RecruitmentJobNav } from '@/features/hr/recruitment/ats/components/recruitment-job-nav';
import {
  ATS_PIPELINE_COLUMN_STYLES,
  type AtsPipelineColumnStyle,
} from '@/features/hr/recruitment/ats/constants/ats-pipeline-board';
import type { AtsPipelineBoardModel } from '@/features/hr/recruitment/ats/hooks/useAtsPipelineBoardModel';
import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';

type Props = { model: AtsPipelineBoardModel };

export function PipelineBoardViews({ model }: Props) {
  const {
    jobFilter,
    jobs,
    formById,
    applicantsByStage,
    totalApplicants,
    selectedJob,
    loading,
    draggingId,
    dropStage,
    stageOrder,
    openApplicantDetail,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    clearDropStage,
  } = model;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 animate-fade-in">
      <RecruitmentJobNav
        jobId={jobFilter !== 'all' ? jobFilter : undefined}
        active="pipeline"
      />

      <PipelineSummaryBar
        total={totalApplicants}
        selectedJob={selectedJob}
        stageOrder={stageOrder}
        applicantsByStage={applicantsByStage}
      />

      {loading ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 sm:mx-0">
          {stageOrder.map((stage) => (
            <div
              key={stage}
              className="h-92 w-[min(88vw,18rem)] shrink-0 animate-pulse rounded-2xl border border-border/60 bg-muted/30 sm:w-72"
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            '-mx-1 flex gap-3 overflow-x-auto pb-3 pt-1 sm:mx-0',
            'snap-x snap-mandatory scroll-smooth sm:snap-none',
            '[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5',
          )}
        >
          {stageOrder.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              style={ATS_PIPELINE_COLUMN_STYLES[stage]}
              applicants={applicantsByStage[stage] ?? []}
              jobs={jobs}
              formById={formById}
              showJobTitle={jobFilter === 'all'}
              draggingId={draggingId}
              isDropTarget={dropStage === stage && draggingId !== null}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDrop={(e) => void handleDrop(e, stage)}
              onDragLeave={clearDropStage}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onOpenApplicant={openApplicantDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineSummaryBar({
  total,
  selectedJob,
  stageOrder,
  applicantsByStage,
}: {
  total: number;
  selectedJob?: AtsJob;
  stageOrder: AtsPipelineStage[];
  applicantsByStage: Record<AtsPipelineStage, AtsApplicant[]>;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Kanban className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold sm:text-lg">مسار التوظيف</h2>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {selectedJob
                ? `متابعة متقدمين وظيفة: ${selectedJob.title}`
                : 'لوحة كانبان لجميع المتقدمين عبر مراحل التوظيف'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-[11px] font-medium">
            <Users className="h-3.5 w-3.5" />
            {total} متقدم
          </Badge>
          {selectedJob && (
            <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-[11px]">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="max-w-[12rem] truncate">{selectedJob.title}</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineColumn({
  stage,
  style,
  applicants,
  jobs,
  formById,
  showJobTitle,
  draggingId,
  isDropTarget,
  onDragOver,
  onDrop,
  onDragLeave,
  onDragStart,
  onDragEnd,
  onOpenApplicant,
}: {
  stage: AtsPipelineStage;
  style: AtsPipelineColumnStyle;
  applicants: AtsApplicant[];
  jobs: AtsJob[];
  formById: Map<string, AtsForm>;
  showJobTitle: boolean;
  draggingId: string | null;
  isDropTarget: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onOpenApplicant: (applicantId: string, jobId: string) => void;
}) {
  return (
    <section
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      className={cn(
        'flex h-92 w-[min(88vw,18rem)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all sm:w-72',
        isDropTarget && 'ring-2 ring-primary/35 ring-offset-2 ring-offset-background',
      )}
    >
      <header className="shrink-0 border-b border-border/50 px-3 py-2 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', style.dot)} />
            <h3 className="truncate text-sm font-semibold">{style.label}</h3>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
            {applicants.length}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-2.5">
        <div className="flex flex-col gap-2">
        {applicants.map((app) => {
          const form = formById.get(app.formId);
          const name = form ? getApplicantName(app, form.fields) : 'متقدم';
          return (
            <PipelineApplicantCard
              key={app.id}
              applicant={app}
              name={name}
              initials={getInitials(name)}
              jobTitle={jobs.find((j) => j.id === app.jobId)?.title}
              showJobTitle={showJobTitle}
              isDragging={draggingId === app.id}
              onDragStart={(e) => onDragStart(e, app.id)}
              onDragEnd={onDragEnd}
              onOpen={() => onOpenApplicant(app.id, app.jobId)}
            />
          );
        })}

        {applicants.length === 0 && !isDropTarget && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-6 text-center">
            <Users className="h-5 w-5 text-muted-foreground/25" />
            <p className="text-[11px] text-muted-foreground/60">لا يوجد متقدمون</p>
            <p className="text-[10px] text-muted-foreground/40">اسحب بطاقة إلى هنا</p>
          </div>
        )}

        {isDropTarget && (
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-primary/40 px-3 py-8">
            <p className="text-xs font-medium text-primary">أفلت هنا</p>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}

function PipelineApplicantCard({
  applicant,
  name,
  initials,
  jobTitle,
  showJobTitle,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  applicant: AtsApplicant;
  name: string;
  initials: string;
  jobTitle?: string;
  showJobTitle: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
}) {
  const score = applicant.score?.finalScore;
  const tone = score != null ? scoreBarTone(score) : null;

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        'group cursor-grab overflow-hidden border-border/80 bg-card shadow-soft transition-all active:cursor-grabbing',
        isDragging ? 'scale-[0.98] opacity-40 rotate-1' : 'hover:-translate-y-0.5 hover:border-border hover:shadow-elevated',
      )}
    >
      <CardContent className="p-2.5">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-[10px] font-bold text-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-tight">{name}</p>
            {showJobTitle && jobTitle && (
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{jobTitle}</p>
            )}
          </div>
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/50 pt-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <DisplayDate value={applicant.submittedAt} mode="date" className="text-[10px]" />
          </div>
          {score != null && tone ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${score}%` }} />
              </div>
              <span className={cn('text-[10px] font-bold tabular-nums', tone.text)}>{score}</span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground/40">بدون تقييم</span>
          )}
        </div>

        {applicant.isArchived && (
          <Badge variant="outline" className="mt-2 w-full justify-center text-[10px] text-amber-700 border-amber-500/40">
            مؤرشف
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
