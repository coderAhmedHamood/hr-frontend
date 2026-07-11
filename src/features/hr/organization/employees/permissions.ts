import { SYSTEM_ORGANIZATION_PERMISSIONS } from '@/features/auth/permissions/codes';
import type { PagePermissionDefs } from '@/features/auth/permissions/types';

export const EMPLOYEES_PAGE_PERMISSIONS = {
  read: 'hr.employees.read',
  create: 'hr.employees.create',
  update: 'hr.employees.update',
  delete: 'hr.employees.delete',
  export: 'hr.employees.export',
} as const satisfies PagePermissionDefs;

/**
 * Filter permission codes used by the employees page toolbar. Missing one of
 * these must never lock the page — see `useFilterPermission`.
 */
export const EMPLOYEES_FILTER_PERMISSIONS = {
  branch: SYSTEM_ORGANIZATION_PERMISSIONS.branches.read,
  department: SYSTEM_ORGANIZATION_PERMISSIONS.departments.read,
} as const;
