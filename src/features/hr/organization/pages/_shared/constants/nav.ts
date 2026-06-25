import { Bell, Building2, Settings } from 'lucide-react';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

export const hrSettingsNavGroups = [
  {
    labelAr: 'الإعدادات',
    items: [
      {
        slug: 'hr' as const,
        labelAr: 'الموارد البشرية',
        href: hrOrganizationRoutes.pagesHr,
        icon: Bell,
      },
      {
        slug: 'organization' as const,
        labelAr: 'النظام والمنظمة',
        href: hrOrganizationRoutes.pagesOrganization,
        icon: Building2,
      },
    ],
  },
] as const;

export type HrSettingsSectionSlug = 'hr' | 'organization';

export function hrSettingsSectionHref(slug: HrSettingsSectionSlug): string {
  return slug === 'hr' ? hrOrganizationRoutes.pagesHr : hrOrganizationRoutes.pagesOrganization;
}

export function isHrSettingsPathActive(pathname: string, slug: HrSettingsSectionSlug): boolean {
  const href = hrSettingsSectionHref(slug);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isHrSettingsNavPath(pathname: string): boolean {
  return (
    pathname === hrOrganizationRoutes.pages ||
    pathname.startsWith(`${hrOrganizationRoutes.pages}/`)
  );
}

export const settingsNavIcon = Settings;
