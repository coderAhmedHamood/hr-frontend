'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { useAtsStore } from '@/features/hr/recruitment/lib/ats/store';
import type { AtsPipelineStage } from '@/features/hr/recruitment/lib/ats/types';
import { getApplicantName, getInitials } from '@/features/hr/recruitment/lib/ats/utils';
import { ATS_STAGE_BADGE, ATS_STAGE_LABELS, scoreBarTone } from '@/features/hr/recruitment/lib/ats/stage-styles';
import { statusDotClass } from '@/shared/status-pill-classes';

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
  const { getTenantApplicants, getTenantJobs, getTenantForms, moveApplicantStage } = useAtsStore();
  const applicants = getTenantApplicants();
  const jobs = getTenantJobs();
  const forms = getTenantForms();

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

  const handleDrop = (e: React.DragEvent, stage: AtsPipelineStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) moveApplicantStage(id, stage);
    setDraggingId(null);
    setDropStage(null);
  };

  const handleDragEnd = () => { setDraggingId(null); setDropStage(null); };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold">مسار التوظيف</h2>
        <p className="text-xs text-muted-foreground">اسحب البطاقات بين الأعمدة لتحديث المرحلة</p>
      </div>

      {/* Board — horizontal scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {STAGE_ORDER.map((stage) => {
            const cfg = STAGES[stage];
            const stageApps = applicants.filter((a) => a.pipelineStage === stage);
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
                    const form = forms.find((f) => f.id === app.formId);
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
                        className={`group rounded-lg border border-border bg-card px-3 py-2.5 shadow-soft transition-all select-none
                          ${isDragging ? 'opacity-30 scale-95 rotate-1' : 'cursor-grab hover:shadow-elevated hover:-translate-y-px'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold leading-tight">{name}</p>
                            {jobTitle && <p className="truncate text-[10px] text-muted-foreground">{jobTitle}</p>}
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
