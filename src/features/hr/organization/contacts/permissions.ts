import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/** Permission codes for the system users (contacts) directory page. */
export const CONTACTS_PAGE_PERMISSIONS = {
  read: 'system.users.read',
  create: 'system.users.create',
  update: 'system.users.update',
  delete: 'system.users.delete',
} as const satisfies PagePermissionDefs;
