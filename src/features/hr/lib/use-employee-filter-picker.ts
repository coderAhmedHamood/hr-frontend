'use client';

import * as React from 'react';
import type { EmployeePickerOption } from '@/components/ui/employee-picker';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

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
  const [employees, setEmployees] = React.useState<EmployeePickerOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!enabled || !companyId) {
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
      .catch((err) => {
        if (cancelled) return;
        handleApiError(err, 'employee-filter-picker.load');
        setEmployees([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, enabled, limit]);

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
