import type { Employee } from '@/features/hr/organization/employees/types';

/**
 * Fetches every page of an employee-profile endpoint that paginates with
 * `page` / `pageSize` (audit log, requests) — 200 per request, the API maximum.
 */
export async function fetchAllProfilePages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<{ items: T[]; totalPages: number }>,
  pageSize = 200,
): Promise<T[]> {
  const first = await fetchPage(1, pageSize);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await fetchPage(page, pageSize);
    items.push(...next.items);
  }
  return items;
}

/** Subtitle lines of an employee-profile register: the employee, then the active filters. */
export function employeeExportSubtitle(
  employee: Pick<Employee, 'name' | 'employeeCode'>,
  ...filters: (string | null | undefined | false)[]
): string[] {
  const who = employee.employeeCode ? `${employee.name} (${employee.employeeCode})` : employee.name;
  return [`الموظف: ${who}`, ...filters.filter((f): f is string => !!f)];
}
