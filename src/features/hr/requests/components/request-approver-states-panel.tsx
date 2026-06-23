'use client';

import * as React from 'react';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { cn, formatDisplayDateTime } from '@/shared/utils';
import { STATUS_PILL } from '@/shared/status-pill-classes';
import type { RequestApproverStatesSnapshot } from '@/features/hr/requests/lib/api/request-approver-states-types';
import {
  requestApprovalModeLabelAr,
  requestApproverStatusLabelAr,
} from '@/features/hr/requests/lib/request-approver-states';

function statusIcon(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  if (status === 'rejected') return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  return <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />;
}

function statusPillClass(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') return STATUS_PILL.approved;
  if (status === 'rejected') return STATUS_PILL.rejected;
  return STATUS_PILL.pending;
}

export function RequestApproverStatesPanel({
  states,
  compact = false,
  className,
}: {
  states: RequestApproverStatesSnapshot | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  if (!states?.approvers?.length) return null;

  const approvers = [...states.approvers].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className={cn('space-y-2 rounded-lg border border-border bg-muted/15 p-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">مسار الموافقات</p>
        <span className="text-[10px] text-muted-foreground">
          {requestApprovalModeLabelAr(states.approvalMode)}
        </span>
      </div>
      <div className="space-y-1.5">
        {approvers.map((a, idx) => (
          <div
            key={`${a.employeeId}-${a.sortOrder}`}
            className={cn(
              'rounded-md border border-border/60 bg-background px-3 py-2',
              compact ? 'text-[11px]' : 'text-xs',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium leading-tight">
                  {states.approvalMode === 'sequential' ? `${idx + 1}. ` : ''}{a.employeeNameAr}
                </p>
                {a.decidedAt ? (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatDisplayDateTime(a.decidedAt)}
                  </p>
                ) : null}
                {a.notes ? (
                  <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2" title={a.notes}>
                    {a.notes}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {statusIcon(a.status)}
                <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', statusPillClass(a.status))}>
                  {requestApproverStatusLabelAr(a.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
