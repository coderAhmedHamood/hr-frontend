'use client';

import * as React from 'react';
import type { ListFilterInlineSelect } from '@/components/ui/list-filter-bar';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { organizationActiveListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import { loadFilterOptionsAll } from '@/features/hr/lib/load-filter-options';
import { hrFiltersKey, usePersistedFilterState } from '@/features/hr/lib/use-persisted-filter-state';

/**
 * Branch / department filter shared by every HR list: filters by the
 * employee's primary assignment (server `branchId` / `departmentId`).
 * Choices are kept per screen like the other filters.
 */
export function useOrgFilter(
  section: string,
  page: string,
  companyId: string | null | undefined,
  /** `branch: false` for a screen that already has its own branch filter. */
  options?: { branch?: boolean },
) {
  const withBranch = options?.branch ?? true;
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [branchId, setBranchId] = usePersistedFilterState(
    hrFiltersKey(section, page, companyId, 'branchId'),
    'all',
  );
  const [departmentId, setDepartmentId] = usePersistedFilterState(
    hrFiltersKey(section, page, companyId, 'departmentId'),
    'all',
  );

  React.useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    void loadFilterOptionsAll({
      branches: () => branchesApi.getAll({ limit: 200, companyId, ...organizationActiveListArchiveQuery() }),
      departments: () => departmentsApi.getAll({ limit: 200, companyId, ...organizationActiveListArchiveQuery() }),
    }).then((res) => {
      if (cancelled) return;
      if (res.branches) setBranches(res.branches.items);
      if (res.departments) setDepartments(res.departments.items);
    });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const query = React.useMemo(() => ({
    ...(withBranch && branchId !== 'all' ? { branchId } : {}),
    ...(departmentId !== 'all' ? { departmentId } : {}),
  }), [withBranch, branchId, departmentId]);

  const inlineSelects = React.useMemo((): ListFilterInlineSelect[] => {
    const selects: ListFilterInlineSelect[] = [];
    if (withBranch && branches.length > 0) {
      selects.push({
        id: 'branchId',
        value: branchId,
        onChange: setBranchId,
        placeholder: 'الفرع',
        className: 'w-[9rem]',
        options: [{ value: 'all', label: 'كل الفروع' }, ...branches.map((b) => ({ value: b.id, label: b.nameAr }))],
      });
    }
    if (departments.length > 0) {
      selects.push({
        id: 'departmentId',
        value: departmentId,
        onChange: setDepartmentId,
        placeholder: 'القسم',
        className: 'w-[9rem]',
        options: [{ value: 'all', label: 'كل الأقسام' }, ...departments.map((d) => ({ value: d.id, label: d.nameAr }))],
      });
    }
    return selects;
  }, [withBranch, branches, departments, branchId, departmentId, setBranchId, setDepartmentId]);

  /** Lines for a printed register («الفرع: …»). */
  const summaryLines = React.useMemo(() => {
    const lines: string[] = [];
    if (withBranch && branchId !== 'all') {
      lines.push(`الفرع: ${branches.find((b) => b.id === branchId)?.nameAr ?? '—'}`);
    }
    if (departmentId !== 'all') lines.push(`القسم: ${departments.find((d) => d.id === departmentId)?.nameAr ?? '—'}`);
    return lines;
  }, [withBranch, branchId, departmentId, branches, departments]);

  return {
    branchId,
    departmentId,
    query,
    inlineSelects,
    summaryLines,
    /** Stable string for `resetDeps`. */
    resetKey: `${withBranch ? branchId : ''}|${departmentId}`,
    activeCount: (withBranch && branchId !== 'all' ? 1 : 0) + (departmentId !== 'all' ? 1 : 0),
  };
}

export type OrgFilterModel = ReturnType<typeof useOrgFilter>;
