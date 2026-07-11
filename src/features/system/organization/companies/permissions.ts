import { SYSTEM_ORGANIZATION_PERMISSIONS } from '@/features/auth/permissions/codes';
import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the companies directory page. */
export const COMPANIES_PAGE_PERMISSIONS = {
  ...SYSTEM_ORGANIZATION_PERMISSIONS.companies,
} as const satisfies PagePermissionDefs;
