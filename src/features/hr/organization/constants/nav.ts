import { Users } from 'lucide-react';
import { HR_ORGANIZATION_BASE, hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

export const hrOrganizationStructureNavItems = [
  { labelAr: 'سجل الموظفين', href: hrOrganizationRoutes.employees, icon: Users },
] as const;

export function isHrOrganizationNavPath(pathname: string): boolean {
  return pathname === HR_ORGANIZATION_BASE || pathname.startsWith(`${HR_ORGANIZATION_BASE}/`);
}
