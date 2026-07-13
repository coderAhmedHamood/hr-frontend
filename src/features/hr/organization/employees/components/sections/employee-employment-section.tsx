'use client';

import { Archive, Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeAssignmentList } from '@/features/hr/organization/employees/components/sections/employee-assignment-list';
import { EmployeePrimaryAssignmentCard } from '@/features/hr/organization/employees/components/sections/employee-primary-assignment-card';

export function EmployeeEmploymentSection({ model }: { model: EmployeeProfileModel }) {
  const {
    hrAssignments,
    primaryAssignment,
    assignmentsLoading,
    assignmentsError,
    setAssignmentDialogOpen,
    setEditAssignment,
    setDeleteAssignmentTarget,
  } = model;

  const activeCount = hrAssignments.filter((a) => !a.isArchived).length;
  const archivedCount = hrAssignments.filter((a) => a.isArchived).length;
  const showArchivedBlock = !assignmentsLoading && archivedCount > 0;

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

      <EmployeePrimaryAssignmentCard
        assignment={primaryAssignment}
        loading={assignmentsLoading}
      />

      <FieldGroup title="الإسنادات الفعّالة" hint={`${activeCount} سجل`}>
        <EmployeeAssignmentList
          mode="active"
          assignments={hrAssignments}
          loading={assignmentsLoading}
          error={assignmentsError}
          onEdit={(row) => setEditAssignment(row)}
          onDelete={(row) => setDeleteAssignmentTarget(row)}
        />
      </FieldGroup>

      {showArchivedBlock ? (
        <FieldGroup title="الإسنادات المؤرشفة" hint={`${archivedCount} سجل`}>
          <div className="col-span-full mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Archive className="h-3.5 w-3.5 shrink-0" />
            سجلات سابقة منتهية أو مؤرشفة — للعرض فقط دون تعديل.
          </div>
          <EmployeeAssignmentList
            mode="archived"
            assignments={hrAssignments}
            loading={false}
            error={null}
            onDelete={(row) => setDeleteAssignmentTarget(row)}
          />
        </FieldGroup>
      ) : null}
    </section>
  );
}
