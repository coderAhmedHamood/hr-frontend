'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type {
  CreateEmployeeAssignmentDto,
  UpdateEmployeeAssignmentDto,
} from '@/features/hr/organization/employees/lib/api/employee-assignments';
import {
  createEmployeeAssignment,
  deleteEmployeeAssignment,
  loadEmployeeAssignmentsEnriched,
  resolvePrimaryAssignment,
  updateEmployeeAssignment,
  type EnrichedEmployeeAssignment,
} from '@/features/hr/organization/employees/services/employee-assignments.service';
import type { Employee } from '@/features/hr/organization/employees/types';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { resolveAssignmentCompanyContextFromProfile } from '@/features/hr/organization/employees/services/employee-company.service';

export function useEmployeeProfileAssignments(employee: Employee, enabled = true) {
  const defaultCompanyId = useDefaultCompanyId();
  const [assignments, setAssignments] = React.useState<EnrichedEmployeeAssignment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = React.useState(false);
  const [editAssignment, setEditAssignment] = React.useState<EnrichedEmployeeAssignment | null>(null);
  const [deleteAssignmentTarget, setDeleteAssignmentTarget] =
    React.useState<EnrichedEmployeeAssignment | null>(null);
  const [savingAssignment, setSavingAssignment] = React.useState(false);

  const reload = React.useCallback(async () => {
    if (!employee.id) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await loadEmployeeAssignmentsEnriched(employee.id);
      setAssignments(rows);
    } catch (e) {
      const { displayMessage } = handleApiError(e, 'employee-assignments.load');
      setError(displayMessage);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [employee.id]);

  React.useEffect(() => {
    if (!enabled) return;
    void reload();
  }, [enabled, reload]);

  const primaryAssignment = React.useMemo(
    () => resolvePrimaryAssignment(assignments),
    [assignments],
  );

  const primaryEnriched = React.useMemo(
    () => assignments.find((a) => a.id === primaryAssignment?.id) ?? null,
    [assignments, primaryAssignment],
  );

  const branch = React.useMemo(() => {
    if (primaryEnriched) {
      return { id: primaryEnriched.branchId, name: primaryEnriched.branchNameAr };
    }
    if (employee.branchId) {
      return {
        id: employee.branchId,
        name: employee.branchNameAr ?? '—',
      };
    }
    return null;
  }, [employee.branchId, employee.branchNameAr, primaryEnriched]);

  const department = React.useMemo(() => {
    if (primaryEnriched?.departmentId) {
      return {
        id: primaryEnriched.departmentId,
        name: primaryEnriched.departmentNameAr ?? '—',
      };
    }
    if (employee.departmentId) {
      return {
        id: employee.departmentId,
        name: employee.departmentNameAr ?? '—',
      };
    }
    return null;
  }, [employee.departmentId, employee.departmentNameAr, primaryEnriched]);

  const submitAssignment = React.useCallback(
    async (payload: CreateEmployeeAssignmentDto) => {
      setSavingAssignment(true);
      try {
        await createEmployeeAssignment(employee.id, payload);
        toast.success('تم إضافة الإسناد بنجاح');
        setAssignmentDialogOpen(false);
        await reload();
      } catch (e) {
        const { displayMessage } = handleApiError(e, 'employee-assignments.create');
        toast.error(displayMessage);
        throw e;
      } finally {
        setSavingAssignment(false);
      }
    },
    [employee.id, reload],
  );

  const submitAssignmentUpdate = React.useCallback(
    async (assignmentId: string, payload: UpdateEmployeeAssignmentDto) => {
      setSavingAssignment(true);
      try {
        await updateEmployeeAssignment(employee.id, assignmentId, payload);
        toast.success('تم تحديث الإسناد');
        setEditAssignment(null);
        await reload();
      } catch (e) {
        const { displayMessage } = handleApiError(e, 'employee-assignments.update');
        toast.error(displayMessage);
        throw e;
      } finally {
        setSavingAssignment(false);
      }
    },
    [employee.id, reload],
  );

  const assignmentCompanyContext = React.useMemo(
    () => resolveAssignmentCompanyContextFromProfile({
      primaryAssignment: primaryEnriched,
      defaultCompanyId,
    }),
    [defaultCompanyId, primaryEnriched],
  );

  const confirmDeleteAssignment = React.useCallback(async () => {
    if (!deleteAssignmentTarget) return;
    try {
      await deleteEmployeeAssignment(employee.id, deleteAssignmentTarget.id);
      toast.success('تم حذف الإسناد');
      setDeleteAssignmentTarget(null);
      await reload();
    } catch (e) {
      toast.error(handleApiError(e, 'employee-assignments.delete').displayMessage);
    }
  }, [deleteAssignmentTarget, employee.id, reload]);

  return {
    hrAssignments: assignments,
    primaryAssignment: primaryEnriched,
    branch,
    department,
    assignmentsLoading: loading,
    assignmentsError: error,
    reloadAssignments: reload,
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    editAssignment,
    setEditAssignment,
    deleteAssignmentTarget,
    setDeleteAssignmentTarget,
    savingAssignment,
    submitAssignment,
    submitAssignmentUpdate,
    confirmDeleteAssignment,
    assignmentCompanyContext,
  };
}

export type EmployeeProfileAssignmentsModel = ReturnType<typeof useEmployeeProfileAssignments>;
