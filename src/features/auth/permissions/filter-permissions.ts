import { SYSTEM_ORGANIZATION_PERMISSIONS } from '@/features/auth/permissions/codes';

/**
 * Common filter permission codes shared across list pages.
 * Feature-specific pages may still export their own
 * `<FEATURE>_FILTER_PERMISSIONS` map (e.g. `DEPARTMENTS_FILTER_PERMISSIONS`)
 * next to their `<FEATURE>_PAGE_PERMISSIONS` when they need codes not listed
 * here.
 */
export const FILTER_PERMISSIONS = {
  branch: SYSTEM_ORGANIZATION_PERMISSIONS.branches.read,
  department: SYSTEM_ORGANIZATION_PERMISSIONS.departments.read,
  employee: 'hr.employees.read',
} as const;
