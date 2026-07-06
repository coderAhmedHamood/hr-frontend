'use client';

import * as React from 'react';
import type { EmployeePickerOption } from '@/components/ui/employee-picker';
import { usePageAccess } from '@/features/auth/permissions/use-page-access';
import { FILTER_PERMISSIONS } from '@/features/auth/permissions/filter-permissions';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';

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
            departmentNameAr: e.departmentNameAr ?? undefined,
            branchNameAr: e.branchNameAr ?? undefined,
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
    departmentNameAr?: string | null;
    branchNameAr?: string | null;
  }>,
): EmployeePickerOption[] {
  return items.map((e) => ({
    id: e.id,
    name: e.nameAr?.trim() || e.nameEn?.trim() || '—',
    departmentNameAr: e.departmentNameAr ?? undefined,
    branchNameAr: e.branchNameAr ?? undefined,
  }));
}

/** Lazy-load employee picker options (call from `onEmployeePickerOpen` only). */
export async function fetchEmployeeFilterPickerOptions(
  companyId: string,
  limit = DEFAULT_LIMIT,
): Promise<EmployeePickerOption[]> {
  const res = await employeesApi.getAll({ companyId, limit });
  return mapEmployeesToPickerOptions(res.items);
}
