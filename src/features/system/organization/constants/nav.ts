import { Bell, Briefcase, Building2, Landmark, UserCircle } from 'lucide-react';
import { SYSTEM_ORGANIZATION_BASE, systemOrganizationRoutes } from '@/features/system/organization/constants/routes';

export const systemOrganizationStructureNavItems = [
  { labelAr: 'المستخدمين', href: systemOrganizationRoutes.contacts, icon: UserCircle },
  { labelAr: 'المسميات الوظيفية', href: systemOrganizationRoutes.jobTitles, icon: Briefcase },
  { labelAr: 'الفروع', href: systemOrganizationRoutes.branches, icon: Building2 },
  { labelAr: 'الأقسام', href: systemOrganizationRoutes.departments, icon: Building2 },
  { labelAr: 'الهيكل التنظيمي', href: systemOrganizationRoutes.chart, icon: Building2 },
] as const;

export const systemOrganizationSettingsNavItems = [
  { labelAr: 'إعدادات الشركة', href: systemOrganizationRoutes.pagesCompany, icon: Landmark },
  { labelAr: 'إعدادات الموارد البشرية', href: systemOrganizationRoutes.pagesHr, icon: Bell },
  { labelAr: 'إعدادات النظام', href: systemOrganizationRoutes.pagesOrganization, icon: Building2 },
] as const;

export function isSystemOrganizationNavPath(pathname: string): boolean {
  return pathname === SYSTEM_ORGANIZATION_BASE || pathname.startsWith(`${SYSTEM_ORGANIZATION_BASE}/`);
}

const SYSTEM_ORGANIZATION_PAGES_BASE = systemOrganizationRoutes.pages;

/** Structure/directory pages — everything under /system/organization except /pages/*. */
export function isSystemOrganizationStructureNavPath(pathname: string): boolean {
  return isSystemOrganizationNavPath(pathname)
    && pathname !== SYSTEM_ORGANIZATION_PAGES_BASE
    && !pathname.startsWith(`${SYSTEM_ORGANIZATION_PAGES_BASE}/`);
}

/** Settings pages — /system/organization/pages/*. */
export function isSystemOrganizationSettingsNavPath(pathname: string): boolean {
  return pathname === SYSTEM_ORGANIZATION_PAGES_BASE || pathname.startsWith(`${SYSTEM_ORGANIZATION_PAGES_BASE}/`);
}
