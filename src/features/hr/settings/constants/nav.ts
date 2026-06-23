import { Bell, Building2, Settings } from 'lucide-react';

export const hrSettingsNavGroups = [
  {
    labelAr: 'الإعدادات',
    items: [
      { slug: 'hr', labelAr: 'الموارد البشرية', href: '/hr/settings/hr', icon: Bell },
      { slug: 'organization', labelAr: 'النظام والمنظمة', href: '/hr/settings/organization', icon: Building2 },
    ],
  },
] as const;

export type HrSettingsSectionSlug = 'hr' | 'organization';

export function hrSettingsSectionHref(slug: HrSettingsSectionSlug): string {
  return `/hr/settings/${slug}`;
}

export function isHrSettingsPathActive(pathname: string, slug: HrSettingsSectionSlug): boolean {
  return pathname === hrSettingsSectionHref(slug) || pathname.startsWith(`${hrSettingsSectionHref(slug)}/`);
}

export function isHrSettingsNavPath(pathname: string): boolean {
  return pathname === '/hr/settings' || pathname.startsWith('/hr/settings/');
}

export const settingsNavIcon = Settings;
