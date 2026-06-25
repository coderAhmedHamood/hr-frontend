'use client';

import type { ReactNode } from 'react';
import { CheckCircle2, Edit3, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

export type WorkflowStatusTone =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'warning'
  | 'info'
  | 'success'
  | 'muted'
  | 'primary';

const STATUS_TONE_CLASSES: Record<WorkflowStatusTone, { badge: string; dot: string }> = {
  pending: { badge: 'bg-gold/10 text-gold border-gold/30', dot: 'bg-gold' },
  approved: { badge: 'bg-success/10 text-success border-success/30', dot: 'bg-success' },
  rejected: { badge: 'bg-destructive/10 text-destructive border-destructive/30', dot: 'bg-destructive' },
  warning: { badge: 'bg-warning/10 text-warning border-warning/30', dot: 'bg-warning' },
  info: { badge: 'bg-primary/10 text-primary border-primary/30', dot: 'bg-primary' },
  success: { badge: 'bg-success/10 text-success border-success/30', dot: 'bg-success' },
  muted: { badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
  primary: { badge: 'bg-primary/10 text-primary border-primary/30', dot: 'bg-primary' },
};

export type EntityActionCardStatus = {
  label: string;
  tone?: WorkflowStatusTone;
  className?: string;
  dotClassName?: string;
  meta?: ReactNode;
};

export type EntityActionCardWorkflow = {
  showApproveReject?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  approveLabel?: string;
  rejectLabel?: string;
};

export type EntityActionCardProps = {
  onClick?: () => void;
  reference?: string;
  title: string;
  subtitle?: ReactNode;
  avatarLetter?: string;
  status?: EntityActionCardStatus;
  chips?: ReactNode;
  metrics?: ReactNode;
  description?: string;
  children?: ReactNode;
  workflow?: EntityActionCardWorkflow;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  extraFooter?: ReactNode;
  footerNote?: ReactNode;
  className?: string;
};

export function EntityActionCardStatusBadge({ status }: { status: EntityActionCardStatus }) {
  const tone = status.tone ? STATUS_TONE_CLASSES[status.tone] : null;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        tone?.badge,
        status.className,
      )}
    >
      {(tone?.dot || status.dotClassName) ? (
        <span className={cn('h-1.5 w-1.5 rounded-full', tone?.dot, status.dotClassName)} />
      ) : null}
      {status.label}
    </span>
  );
}

export function EntityActionCardStatusBlock({ status, compact = false }: { status: EntityActionCardStatus; compact?: boolean }) {
  return (
    <div className={cn('space-y-0.5 text-end', compact ? 'min-w-0 shrink-0' : '')}>
      <EntityActionCardStatusBadge status={status} />
      {status.meta ? (
        <div className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-[11px]')}>{status.meta}</div>
      ) : null}
    </div>
  );
}

export function EntityActionCardMetricsRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2', className)}>
      {children}
    </div>
  );
}

export function EntityActionCardMetric({ label, value, dir }: { label: string; value: ReactNode; dir?: 'ltr' | 'rtl' }) {
  return (
    <div className="text-center">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={cn('text-xs font-bold', dir === 'ltr' ? 'font-mono' : '')} dir={dir}>
        {value}
      </p>
    </div>
  );
}

export function EntityActionCardMetricDivider() {
  return <div className="h-4 w-px bg-border/60" />;
}

export function EntityActionCard({
  onClick,
  reference,
  title,
  subtitle,
  avatarLetter,
  status,
  chips,
  metrics,
  description,
  children,
  workflow,
  onEdit,
  onDelete,
  editLabel = 'تعديل',
  deleteLabel = 'حذف',
  extraFooter,
  footerNote,
  className,
}: EntityActionCardProps) {
  const showApproveReject = Boolean(workflow?.showApproveReject && (workflow.onApprove || workflow.onReject));
  const showEditDelete = Boolean(onEdit || onDelete);
  const avatar = avatarLetter?.trim()?.charAt(0) ?? title.trim().charAt(0) ?? '?';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-150',
        onClick && 'cursor-pointer hover:-translate-y-px hover:shadow-md',
        className,
      )}
    >
      <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {avatar}
          </div>
          <div className="min-w-0 flex-1">
            {reference ? (
              <p className="font-mono text-[10px] font-bold text-muted-foreground" dir="ltr">
                {reference}
              </p>
            ) : null}
            <p className={cn('truncate text-sm font-semibold leading-tight transition-colors group-hover:text-primary', reference && 'mt-0.5')}>
              {title}
            </p>
            {subtitle ? <div className="text-[10px] text-muted-foreground">{subtitle}</div> : null}
          </div>
          {status ? <EntityActionCardStatusBlock status={status} compact /> : null}
        </div>

        {chips ? <div className="flex flex-wrap gap-1.5">{chips}</div> : null}
        {metrics}
        {description?.trim() ? (
          <p className="  text-xs text-muted-foreground text-right" title={description}>
            {description}
          </p>
        ) : null}
        {children}
        {footerNote}
      </div>

      {showApproveReject ? (
        <div
          className="flex items-center gap-1 border-t border-border/50 bg-muted/10 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          {workflow?.onApprove ? (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 flex-1 gap-1 px-2 text-xs text-success hover:bg-success/10 hover:text-success"
              onClick={(e) => { e.stopPropagation(); workflow.onApprove?.(); }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {workflow.approveLabel ?? 'موافقة'}
            </Button>
          ) : null}
          {workflow?.onReject ? (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 flex-1 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); workflow.onReject?.(); }}
            >
              <XCircle className="h-3.5 w-3.5" />
              {workflow.rejectLabel ?? 'رفض'}
            </Button>
          ) : null}
        </div>
      ) : null}

      {extraFooter ? (
        <div className="border-t border-border/50 bg-muted/5 px-3 py-2" onClick={(e) => e.stopPropagation()}>
          {extraFooter}
        </div>
      ) : null}

      {showEditDelete ? (
        <div
          className={cn(
            'flex items-center gap-1 border-t border-border/50 bg-muted/10 px-3 py-2',
            !showApproveReject && 'rounded-b-xl',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit ? (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 flex-1 gap-1 px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit3 className="h-3.5 w-3.5" />
              {editLabel}
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 flex-1 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EntityActionCardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {children}
    </div>
  );
}

export function EntityActionCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <EntityActionCardGrid>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-muted/30" />
      ))}
    </EntityActionCardGrid>
  );
}

export function EntityActionCardChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}
