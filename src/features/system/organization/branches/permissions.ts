import { SYSTEM_ORGANIZATION_PERMISSIONS } from '@/features/auth/permissions/codes';
import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the branches directory page. */
export const BRANCHES_PAGE_PERMISSIONS = {
  ...SYSTEM_ORGANIZATION_PERMISSIONS.branches,
} as const satisfies PagePermissionDefs;
