import type { PagePermissionDefs } from '@/features/auth/permissions/types';

/**
 * لا يوجد كود صلاحية منفصل لمسار الجوال — `hr.guidelines.read` نفسه يغطي
 * لوحة تحكم HR ومسار `GET /guidelines/mobile/:companyId` لتطبيق الموظفين.
 */
export const COMPANY_GUIDELINES_PAGE_PERMISSIONS = {
  read: 'hr.guidelines.read',
  create: 'hr.guidelines.create',
  update: 'hr.guidelines.update',
  delete: 'hr.guidelines.delete',
} as const satisfies PagePermissionDefs;
