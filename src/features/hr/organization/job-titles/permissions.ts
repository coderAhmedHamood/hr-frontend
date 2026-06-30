import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the job titles directory page. */
export const JOB_TITLES_PAGE_PERMISSIONS = {
  read: 'hr.organization.job-titles.read',
  create: 'hr.organization.job-titles.create',
  update: 'hr.organization.job-titles.update',
  delete: 'hr.organization.job-titles.delete',
} as const satisfies PagePermissionDefs;
