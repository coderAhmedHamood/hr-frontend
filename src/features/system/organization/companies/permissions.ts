import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the companies directory page. */
export const COMPANIES_PAGE_PERMISSIONS = {
  read: 'hr.organization.companies.read',
  create: 'hr.organization.companies.create',
  update: 'hr.organization.companies.update',
  delete: 'hr.organization.companies.delete',
} as const satisfies PagePermissionDefs;
