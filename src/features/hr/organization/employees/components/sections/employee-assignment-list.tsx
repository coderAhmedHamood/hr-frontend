'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/shared/utils';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import {
  EMPLOYEE_ASSIGNMENT_STATUS_LABELS,
} from '@/features/hr/organization/employees/constants/employee-assignment-labels';
import type { EnrichedEmployeeAssignment } from '@/features/hr/organization/employees/services/employee-assignments.service';
import { Archive, Building2, Loader2, Pencil, Trash2 } from 'lucide-react';

function statusBadgeClass(status: EnrichedEmployeeAssignment['status']): string {
  switch (status) {
    case 'active':
      return 'border-success/30 bg-success/10 text-success';
    case 'suspended':
      return 'border-warning/30 bg-warning/10 text-warning';
    default:
      return 'border-muted-foreground/30 bg-muted/40 text-muted-foreground';
  }
}

function AssignmentRow({
  row,
  archived,
  onEdit,
  onDelete,
}: {
  row: EnrichedEmployeeAssignment;
  archived: boolean;
  onEdit?: (row: EnrichedEmployeeAssignment) => void;
  onDelete?: (row: EnrichedEmployeeAssignment) => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 transition-all',
        archived
          ? 'border-dashed border-border/50 bg-muted/25'
          : 'border-border/70 bg-card shadow-xs hover:border-primary/25 hover:shadow-soft',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-sm font-medium', archived && 'text-muted-foreground')}>
            {row.companyNameAr}
          </span>
          {!archived && row.isPrimary ? (
            <Badge variant="outline" className="text-[10px]">رئيسي</Badge>
          ) : null}
          <Badge variant="outline" className={cn('text-[10px]', statusBadgeClass(row.status))}>
            {EMPLOYEE_ASSIGNMENT_STATUS_LABELS[row.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground/80">الفرع:</span>
          {' '}
          {row.branchNameAr}
          {row.departmentNameAr ? (
            <>
              <span className="mx-1 text-muted-foreground/40">·</span>
              <span className="text-foreground/80">القسم:</span>
              {' '}
              {row.departmentNameAr}
            </>
          ) : null}
          {row.jobTitleNameAr ? (
            <>
              <span className="mx-1 text-muted-foreground/40">·</span>
              <span className="text-foreground/80">المسمى:</span>
              {' '}
              {row.jobTitleNameAr}
            </>
          ) : null}
        </p>
        <p className="text-[11px] text-muted-foreground/80 tabular-nums">
          الفترة:
          {' '}
          {row.startDate ? formatDate(row.startDate) : '—'}
          {' → '}
          {row.endDate ? formatDate(row.endDate) : 'مفتوح'}
        </p>
        {archived && row.archivedAt ? (
          <p className="text-[10px] text-muted-foreground/70 tabular-nums">
            أُرشف في {formatDate(row.archivedAt)}
            {row.archivedReason ? ` · ${row.archivedReason}` : ''}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground/60 tabular-nums">
            أُنشئ {formatDate(row.createdAt)}
            {row.updatedAt !== row.createdAt ? ` · آخر تحديث ${formatDate(row.updatedAt)}` : ''}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!archived && onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(row)}
            aria-label="تعديل الإسناد"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(row)}
            aria-label="حذف الإسناد"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type ListProps = {
  assignments: EnrichedEmployeeAssignment[];
  loading: boolean;
  error: string | null;
  mode: 'active' | 'archived';
  onEdit?: (row: EnrichedEmployeeAssignment) => void;
  onDelete?: (row: EnrichedEmployeeAssignment) => void;
};

export function EmployeeAssignmentList({
  assignments,
  loading,
  error,
  mode,
  onEdit,
  onDelete,
}: ListProps) {
  const archived = mode === 'archived';
  const rows = assignments.filter((a) => (archived ? a.isArchived : !a.isArchived));

  if (loading) {
    return (
      <div className="col-span-full flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل سجل الإسنادات…
      </div>
    );
  }

  if (error) {
    return (
      <p className="col-span-full rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="col-span-full">
        <Empty
          icon={archived ? Archive : Building2}
          text={
            archived
              ? 'لا توجد إسنادات مؤرشفة لهذا الموظف.'
              : 'لا يوجد إسناد فعّال — أضف إسناداً لربط الموظف بشركة وفرع وقسم.'
          }
        />
      </div>
    );
  }

  return (
    <div className="col-span-full space-y-2">
      {rows.map((row) => (
        <AssignmentRow
          key={row.id}
          row={row}
          archived={archived}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
