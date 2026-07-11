import { SYSTEM_ORGANIZATION_PERMISSIONS } from '@/features/auth/permissions/codes';
import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the job titles directory page. */
export const JOB_TITLES_PAGE_PERMISSIONS = {
  ...SYSTEM_ORGANIZATION_PERMISSIONS.jobTitles,
} as const satisfies PagePermissionDefs;
