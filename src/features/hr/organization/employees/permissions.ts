import type { PagePermissionDefs } from '@/features/auth/permissions/types';

export const EMPLOYEES_PAGE_PERMISSIONS = {
  read: 'hr.employees.read',
  create: 'hr.employees.create',
  update: 'hr.employees.update',
  delete: 'hr.employees.delete',
  export: 'hr.employees.export',
} as const satisfies PagePermissionDefs;
