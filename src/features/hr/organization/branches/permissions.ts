import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the branches directory page. */
export const BRANCHES_PAGE_PERMISSIONS = {
  read: 'hr.organization.branches.read',
  create: 'hr.organization.branches.create',
  update: 'hr.organization.branches.update',
  delete: 'hr.organization.branches.delete',
} as const satisfies PagePermissionDefs;
