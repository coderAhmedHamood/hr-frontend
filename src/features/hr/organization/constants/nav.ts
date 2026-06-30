import { Bell, Briefcase, Building2, Landmark, UserCircle, Users } from 'lucide-react';
import { HR_ORGANIZATION_BASE, hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

export const hrOrganizationStructureNavItems = [
  { labelAr: 'سجل الموظفين', href: hrOrganizationRoutes.employees, icon: Users },
  { labelAr: 'المستخدمين', href: hrOrganizationRoutes.contacts, icon: UserCircle },
  { labelAr: 'المسميات الوظيفية', href: hrOrganizationRoutes.jobTitles, icon: Briefcase },
  { labelAr: 'الفروع', href: hrOrganizationRoutes.branches, icon: Building2 },
  { labelAr: 'الأقسام', href: hrOrganizationRoutes.departments, icon: Building2 },
  { labelAr: 'الهيكل التنظيمي', href: hrOrganizationRoutes.chart, icon: Building2 },
] as const;

export const hrOrganizationSettingsNavItems = [
  { labelAr: 'إعدادات الشركة', href: hrOrganizationRoutes.pagesCompany, icon: Landmark },
  { labelAr: 'إعدادات الموارد البشرية', href: hrOrganizationRoutes.pagesHr, icon: Bell },
  { labelAr: 'إعدادات النظام', href: hrOrganizationRoutes.pagesOrganization, icon: Building2 },
] as const;

export function isHrOrganizationNavPath(pathname: string): boolean {
  return pathname === HR_ORGANIZATION_BASE || pathname.startsWith(`${HR_ORGANIZATION_BASE}/`);
}
