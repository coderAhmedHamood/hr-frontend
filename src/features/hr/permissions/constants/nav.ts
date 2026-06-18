import type { LucideIcon } from 'lucide-react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import {
  hrPermissionsCatalogHref,
  hrPermissionsRolesHref,
} from '@/features/hr/permissions/constants/routes';

export type HRPermissionsNavItem = {
  labelAr: string;
  href: string;
  icon: LucideIcon;
};

export type HRPermissionsNavGroup = {
  labelAr?: string;
  items: HRPermissionsNavItem[];
};

export const hrPermissionsNavGroups: HRPermissionsNavGroup[] = [
  {
    items: [
      { labelAr: 'الصلاحيات', href: hrPermissionsCatalogHref(), icon: KeyRound },
      { labelAr: 'الأدوار', href: hrPermissionsRolesHref(), icon: ShieldCheck },
    ],
  },
];

export function isHrPermissionsNavPath(pathname: string): boolean {
  return pathname === '/hr/permissions' || pathname.startsWith('/hr/permissions/');
}
