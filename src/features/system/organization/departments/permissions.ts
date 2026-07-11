import { SYSTEM_ORGANIZATION_PERMISSIONS } from '@/features/auth/permissions/codes';
import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the departments directory page. */
export const DEPARTMENTS_PAGE_PERMISSIONS = {
  ...SYSTEM_ORGANIZATION_PERMISSIONS.departments,
} as const satisfies PagePermissionDefs;

/** Filter-level permissions used on the departments page. */
export const DEPARTMENTS_FILTER_PERMISSIONS = {
  branch: SYSTEM_ORGANIZATION_PERMISSIONS.branches.read,
} as const;
