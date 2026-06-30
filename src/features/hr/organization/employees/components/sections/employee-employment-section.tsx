'use client';

import { Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeAssignmentList } from '@/features/hr/organization/employees/components/sections/employee-assignment-list';

export function EmployeeEmploymentSection({ model }: { model: EmployeeProfileModel }) {
  const {
    hrAssignments,
    assignmentsLoading,
    assignmentsError,
    setAssignmentDialogOpen,
    setEditAssignment,
    setDeleteAssignmentTarget,
  } = model;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-arabic-display text-lg font-semibold tracking-tight text-foreground">
            <Briefcase className="h-5 w-5 shrink-0 text-primary" />
            بيانات التوظيف
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            الإسناد التنظيمي (شركة · فرع · قسم · مسمى) وسجل التعيينات
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0 gap-2 shadow-sm"
          onClick={() => setAssignmentDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة إسناد
        </Button>
      </div>

      <FieldGroup
        title="سجل الإسنادات التنظيمية"
        hint={`${hrAssignments.length} سجل`}
      >
        <EmployeeAssignmentList
          assignments={hrAssignments}
          loading={assignmentsLoading}
          error={assignmentsError}
          onEdit={(row) => setEditAssignment(row)}
          onDelete={(row) => setDeleteAssignmentTarget(row)}
        />
      </FieldGroup>
    </section>
  );
}
