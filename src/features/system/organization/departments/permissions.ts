import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the departments directory page. */
export const DEPARTMENTS_PAGE_PERMISSIONS = {
  read: 'hr.organization.departments.read',
  create: 'hr.organization.departments.create',
  update: 'hr.organization.departments.update',
  delete: 'hr.organization.departments.delete',
} as const satisfies PagePermissionDefs;

/**
 * Filter permission codes used by the departments page toolbar. Missing one
 * of these must never lock the page — see `useFilterPermission`.
 */
export const DEPARTMENTS_FILTER_PERMISSIONS = {
  branch: 'hr.organization.branches.read',
} as const;
