'use client';

import * as React from 'react';
import type { EmployeePickerOption } from '@/components/ui/employee-picker';
import { usePageAccess } from '@/features/auth/permissions/use-page-access';
import { FILTER_PERMISSIONS } from '@/features/auth/permissions/filter-permissions';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import {
  employeeMatchesStatus,
  type EmployeeStatusFilter,
  type EmployeeStatusValue,
} from '@/features/hr/lib/employee-status-filter';

const DEFAULT_LIMIT = 500;

export type UseEmployeeFilterPickerOptions = {
  limit?: number;
  enabled?: boolean;
};

/** Loads company employees for toolbar `EmployeePicker` — same source as attendance daily. */
export function useEmployeeFilterPicker(
  companyId: string | null | undefined,
  options?: UseEmployeeFilterPickerOptions,
) {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const enabled = options?.enabled ?? Boolean(companyId);
  const canReadEmployees = usePageAccess(FILTER_PERMISSIONS.employee);
  const [employees, setEmployees] = React.useState<EmployeePickerOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || !companyId || !canReadEmployees) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void employeesApi
      .getAll({ companyId, limit })
      .then((res) => {
        if (cancelled) return;
        setEmployees(
          res.items.map((e) => ({
            id: e.id,
            name: e.nameAr?.trim() || e.nameEn?.trim() || '—',
            branchId: e.branchId ?? undefined,
            departmentNameAr: e.departmentNameAr ?? undefined,
            branchNameAr: e.branchNameAr ?? undefined,
            contractStatus: e.contractStatus ?? null,
          })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setEmployees([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, enabled, limit, canReadEmployees]);

  return { employees, loading };
}

export function mapEmployeesToPickerOptions(
  items: Array<{
    id: string;
    nameAr?: string | null;
    nameEn?: string | null;
    branchId?: string | null;
    departmentNameAr?: string | null;
    branchNameAr?: string | null;
    /** Employee status; `undefined` = unknown (kept by status filters). */
    contractStatus?: string | null;
  }>,
): EmployeePickerOption[] {
  return items.map((e) => ({
    id: e.id,
    name: e.nameAr?.trim() || e.nameEn?.trim() || '—',
    branchId: e.branchId ?? undefined,
    departmentNameAr: e.departmentNameAr ?? undefined,
    branchNameAr: e.branchNameAr ?? undefined,
    contractStatus: e.contractStatus === undefined ? undefined : e.contractStatus ?? null,
  }));
}

/**
 * Lazy-load employee picker options (call from `onEmployeePickerOpen` only).
 * Every status is loaded with its `contractStatus`; `ListFilterBar` narrows the
 * list to the chosen employee status. Pass `statuses` to narrow here instead
 * (create forms: e.g. active only).
 */
export async function fetchEmployeeFilterPickerOptions(
  companyId: string,
  limit = DEFAULT_LIMIT,
  statuses?: EmployeeStatusFilter | readonly EmployeeStatusValue[],
): Promise<EmployeePickerOption[]> {
  const res = await employeesApi.getAll({ companyId, limit });
  const items = statuses
    ? res.items.filter((e) => employeeMatchesStatus(e.contractStatus, statuses))
    : res.items;
  return mapEmployeesToPickerOptions(items);
}

/** Keeps only employees whose status is allowed (create-form pickers). */
export function filterEmployeesByStatus<T extends { contractStatus?: string | null }>(
  items: readonly T[],
  statuses: EmployeeStatusFilter | readonly EmployeeStatusValue[],
): T[] {
  return items.filter((e) => employeeMatchesStatus(e.contractStatus, statuses));
}
