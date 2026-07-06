import type { PagePermissionDefs } from '@/features/auth/permissions/types';
import { FILTER_PERMISSIONS } from '@/features/auth/permissions/filter-permissions';

export const NOTIFICATIONS_ADMIN_PAGE_PERMISSIONS = {
  read: 'hr.notifications.read',
  create: 'hr.notifications.create',
  delete: 'hr.notifications.delete',
} as const satisfies PagePermissionDefs;

export const NOTIFICATIONS_ADMIN_FILTER_PERMISSIONS = {
  employee: FILTER_PERMISSIONS.employee,
  branch: FILTER_PERMISSIONS.branch,
  department: FILTER_PERMISSIONS.department,
} as const;
