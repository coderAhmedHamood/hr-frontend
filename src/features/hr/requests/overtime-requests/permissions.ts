import type { PagePermissionDefs } from '@/features/auth/permissions/types';

export const OVERTIME_REQUESTS_PAGE_PERMISSIONS = {
  read: 'hr.requests.overtime-requests.read',
  create: 'hr.requests.overtime-requests.create',
  update: 'hr.requests.overtime-requests.update',
  delete: 'hr.requests.overtime-requests.delete',
  approve: 'hr.requests.overtime-requests.approve',
} as const satisfies PagePermissionDefs;

/**
 * Filter permission codes used by the overtime requests page toolbar.
 * Missing one of these must never lock the page — see `useFilterPermission`.
 */
export const OVERTIME_REQUESTS_FILTER_PERMISSIONS = {
  employee: 'hr.employees.read',
} as const;
