'use client';

import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/shared/utils';
import {
  EMPLOYEE_ASSIGNMENT_STATUS_LABELS,
} from '@/features/hr/organization/employees/constants/employee-assignment-labels';
import type { EnrichedEmployeeAssignment } from '@/features/hr/organization/employees/services/employee-assignments.service';
import { Building2 } from 'lucide-react';

type Props = {
  assignment: EnrichedEmployeeAssignment | null;
  loading?: boolean;
};

export function EmployeePrimaryAssignmentCard({ assignment, loading }: Props) {
  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-border/60 bg-muted/15 px-4 py-5 text-sm text-muted-foreground">
        جاري تحميل الإسناد الحالي…
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-border/60 bg-muted/15 px-4 py-5">
        <p className="text-sm text-muted-foreground">
          لا يوجد إسناد تنظيمي نشط — أضف إسناداً لربط الموظف بشركة وفرع وقسم ومسمى.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">الإسناد التنظيمي الحالي</p>
          <p className="truncate text-sm font-semibold">{assignment.companyNameAr}</p>
        </div>
        {assignment.isPrimary ? (
          <Badge variant="outline" className="text-[10px]">رئيسي</Badge>
        ) : null}
        <Badge variant="outline" className="text-[10px]">
          {EMPLOYEE_ASSIGNMENT_STATUS_LABELS[assignment.status]}
        </Badge>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <p>
          <span className="text-muted-foreground">الفرع:</span>
          {' '}
          <span className="font-medium">{assignment.branchNameAr}</span>
        </p>
        <p>
          <span className="text-muted-foreground">القسم:</span>
          {' '}
          <span className="font-medium">{assignment.departmentNameAr ?? '— بدون قسم —'}</span>
        </p>
        <p>
          <span className="text-muted-foreground">المسمى:</span>
          {' '}
          <span className="font-medium">{assignment.jobTitleNameAr ?? '—'}</span>
        </p>
        <p className="tabular-nums">
          <span className="text-muted-foreground">الفترة:</span>
          {' '}
          <span className="font-medium">
            {assignment.startDate ? formatDate(assignment.startDate) : '—'}
            {' → '}
            {assignment.endDate ? formatDate(assignment.endDate) : 'مفتوح'}
          </span>
        </p>
      </div>
    </div>
  );
}
