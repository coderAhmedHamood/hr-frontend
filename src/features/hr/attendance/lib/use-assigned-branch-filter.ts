'use client';

import * as React from 'react';
import type { ListFilterInlineSelect } from '@/components/ui/list-filter-bar';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { organizationActiveListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import {
  attendanceFiltersKey,
  usePersistedFilterState,
} from '@/features/hr/attendance/lib/use-persisted-filter-state';

/**
 * Branch of the employee's current organizational assignment (الإسناد),
 * not a separate attendance location.
 */
export function useAssignedBranchFilter(
  companyId: string | null | undefined,
  scope: 'daily' | 'day-summaries',
) {
  const [branchId, setBranchId] = usePersistedFilterState(
    attendanceFiltersKey(scope, companyId, 'assignedBranchId'),
    'all',
  );
  const [branches, setBranches] = React.useState<Array<{ id: string; nameAr: string }>>([]);
  /** null while “every branch” is selected. An empty set means the branch has no assigned employees. */
  const [assignedIds, setAssignedIds] = React.useState<Set<string> | null>(null);

  React.useEffect(() => {
    if (!companyId || branchId === 'all') {
      setAssignedIds(null);
      return;
    }
    let cancelled = false;
    setAssignedIds(null);
    void employeesApi
      .getAll({ companyId, branchId, primaryAssignment: true, limit: 500 })
      .then((res) => {
        if (!cancelled) setAssignedIds(new Set(res.items.map((employee) => employee.id)));
      })
      .catch(() => {
        if (!cancelled) setAssignedIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, companyId]);

  React.useEffect(() => {
    if (!companyId) {
      setBranches([]);
      return;
    }
    let cancelled = false;
    void branchesApi
      .getAll({ companyId, limit: 200, ...organizationActiveListArchiveQuery() })
      .then((res) => {
        if (cancelled) return;
        setBranches(res.items.map((branch) => ({ id: branch.id, nameAr: branch.nameAr })));
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const select = React.useMemo((): ListFilterInlineSelect => ({
    id: 'assignedBranch',
    value: branchId,
    onChange: (value) => setBranchId(value || 'all'),
    placeholder: 'الفرع المسند',
    className: 'w-[11rem]',
    options: [
      { value: 'all', label: 'كل الفروع المسندة' },
      ...branches.map((branch) => ({ value: branch.id, label: branch.nameAr })),
    ],
  }), [branchId, branches, setBranchId]);

  return { branchId, select, assignedIds };
}

/** null = no extra restriction. An empty set means nobody matches. */
export function scopeEmployeeIdsByAssignedBranch(
  assignedIds: Set<string> | null,
  selectedEmpIds: Set<string>,
): Set<string> | null {
  if (!assignedIds) return selectedEmpIds.size > 0 ? selectedEmpIds : null;
  if (selectedEmpIds.size === 0) return assignedIds;
  return new Set([...selectedEmpIds].filter((id) => assignedIds.has(id)));
}
