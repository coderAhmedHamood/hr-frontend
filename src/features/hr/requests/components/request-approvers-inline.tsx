'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import { approvalModeLabelAr, formalApproverStatusLabelAr } from '@/shared/i18n/ar';
import { STATUS_PILL } from '@/shared/status-pill-classes';
import type { ApproverStatesSnapshot } from '@/shared/approval/types';

function statusDotClass(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') return 'bg-emerald-500';
  if (status === 'rejected') return 'bg-destructive';
  return 'bg-gold';
}

function statusPillClass(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') return STATUS_PILL.approved;
  if (status === 'rejected') return STATUS_PILL.rejected;
  return STATUS_PILL.pending;
}

/** Compact approver chain for table cells and card headers. */
export function RequestApproversInline({
  states,
  className,
}: {
  states: ApproverStatesSnapshot | null | undefined;
  className?: string;
}) {
  if (!states?.approvers?.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const approvers = [...states.approvers].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className={cn('space-y-1.5', className)}>
      <span className="inline-flex items-center rounded-md border border-border/70 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        {approvalModeLabelAr(states.approvalMode)}
      </span>
      <div className="flex flex-wrap gap-1">
        {approvers.map((a, idx) => (
          <span
            key={`${a.employeeId}-${a.sortOrder}`}
            title={`${a.employeeNameAr} — ${formalApproverStatusLabelAr(a.status)}`}
            className={cn(
              'inline-flex max-w-[8.5rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              statusPillClass(a.status),
            )}
          >
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass(a.status))} />
            <span className="truncate">
              {states.approvalMode === 'sequential' ? `${idx + 1}. ` : ''}
              {a.employeeNameAr}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
