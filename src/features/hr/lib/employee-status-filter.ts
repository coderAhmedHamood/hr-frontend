'use client';

import * as React from 'react';
import { usePersistedFilterState } from '@/features/hr/lib/use-persisted-filter-state';

/**
 * The employee's own status (`employees.contractStatus`) as a list filter.
 * Empty / null status counts as active, like the employees list.
 */
export type EmployeeStatusValue = 'active' | 'suspended' | 'ended';
export type EmployeeStatusFilter = EmployeeStatusValue | 'all';

export const EMPLOYEE_STATUS_FILTER_DEFAULT: EmployeeStatusFilter = 'active';

export const EMPLOYEE_STATUS_ORDER: readonly EmployeeStatusValue[] = ['active', 'suspended', 'ended'];

export const EMPLOYEE_STATUS_LABELS_AR: Record<EmployeeStatusValue, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  ended: 'منتهي',
};

/** Options for the toolbar select (default first, «كل الحالات» last). */
export const EMPLOYEE_STATUS_FILTER_OPTIONS: readonly { value: EmployeeStatusFilter; label: string }[] = [
  ...EMPLOYEE_STATUS_ORDER.map((value) => ({
    value,
    label: `الموظفون: ${EMPLOYEE_STATUS_LABELS_AR[value]}`,
  })),
  { value: 'all', label: 'الموظفون: كل الحالات' },
];

export function normalizeEmployeeStatusFilter(value: unknown): EmployeeStatusFilter {
  return value === 'active' || value === 'suspended' || value === 'ended' || value === 'all'
    ? value
    : EMPLOYEE_STATUS_FILTER_DEFAULT;
}

/** An employee's status as stored: empty / unknown counts as active. */
export function resolveEmployeeStatus(contractStatus: string | null | undefined): EmployeeStatusValue {
  const s = contractStatus?.trim().toLowerCase();
  return s === 'suspended' || s === 'ended' ? s : 'active';
}

export function employeeMatchesStatus(
  contractStatus: string | null | undefined,
  wanted: EmployeeStatusFilter | readonly EmployeeStatusValue[],
): boolean {
  if (wanted === 'all') return true;
  const status = resolveEmployeeStatus(contractStatus);
  return typeof wanted === 'string' ? status === wanted : wanted.includes(status);
}

/** Query fragment for list endpoints (`employeeStatus`); nothing for «all». */
export function employeeStatusQuery(
  value: EmployeeStatusFilter,
): { employeeStatus?: EmployeeStatusValue } {
  return value === 'all' ? {} : { employeeStatus: value };
}

export function employeeStatusFilterLabelAr(value: EmployeeStatusFilter): string {
  return value === 'all' ? 'كل الحالات' : EMPLOYEE_STATUS_LABELS_AR[value];
}

/** Counts in the active-filter badge only when it differs from the default. */
export function isEmployeeStatusFilterActive(value: EmployeeStatusFilter): boolean {
  return value !== EMPLOYEE_STATUS_FILTER_DEFAULT;
}

/** Persisted employee-status filter for a screen; defaults to active. */
export function useEmployeeStatusFilter(
  storageKey: string | null,
): [EmployeeStatusFilter, (value: string) => void] {
  const [raw, setRaw] = usePersistedFilterState<string>(storageKey, EMPLOYEE_STATUS_FILTER_DEFAULT);
  const value = normalizeEmployeeStatusFilter(raw);
  const setValue = React.useCallback(
    (next: string) => setRaw(normalizeEmployeeStatusFilter(next)),
    [setRaw],
  );
  return [value, setValue];
}

/** Picker rule for create forms: who can be chosen for a new record. */
export const CREATE_PICKER_ACTIVE_ONLY: readonly EmployeeStatusValue[] = ['active'];
export const CREATE_PICKER_ACTIVE_OR_SUSPENDED: readonly EmployeeStatusValue[] = ['active', 'suspended'];
