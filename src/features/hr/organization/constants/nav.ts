import { Bell, Users } from 'lucide-react';
import { HR_ORGANIZATION_BASE, hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

export const hrOrganizationStructureNavItems = [
  { labelAr: 'سجل الموظفين', href: hrOrganizationRoutes.employees, icon: Users },
] as const;

export const hrOrganizationSettingsNavItems = [
  { labelAr: 'إعدادات الموارد البشرية', href: hrOrganizationRoutes.settings, icon: Bell },
] as const;

export function isHrOrganizationNavPath(pathname: string): boolean {
  return pathname === HR_ORGANIZATION_BASE || pathname.startsWith(`${HR_ORGANIZATION_BASE}/`);
}

/** سجل الموظفين — كل شيء تحت /hr/organization/employees. */
export function isHrOrganizationEmployeesNavPath(pathname: string): boolean {
  return pathname === hrOrganizationRoutes.employees || pathname.startsWith(`${hrOrganizationRoutes.employees}/`);
}

/** إعدادات الموارد البشرية — /hr/organization/settings. */
export function isHrOrganizationSettingsNavPath(pathname: string): boolean {
  return pathname === hrOrganizationRoutes.settings || pathname.startsWith(`${hrOrganizationRoutes.settings}/`);
}
