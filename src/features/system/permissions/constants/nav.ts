import type { LucideIcon } from 'lucide-react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import {
  systemPermissionsCatalogHref,
  systemPermissionsRolesHref,
} from '@/features/system/permissions/constants/routes';

export type SystemPermissionsNavItem = {
  labelAr: string;
  href: string;
  icon: LucideIcon;
};

export type SystemPermissionsNavGroup = {
  labelAr?: string;
  items: SystemPermissionsNavItem[];
};

export const systemPermissionsNavGroups: SystemPermissionsNavGroup[] = [
  {
    items: [
      { labelAr: 'الصلاحيات', href: systemPermissionsCatalogHref(), icon: KeyRound },
      { labelAr: 'الأدوار', href: systemPermissionsRolesHref(), icon: ShieldCheck },
    ],
  },
];

export function isSystemPermissionsNavPath(pathname: string): boolean {
  return pathname === '/system/permissions' || pathname.startsWith('/system/permissions/');
}
