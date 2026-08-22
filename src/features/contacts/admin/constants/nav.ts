import type { LucideIcon } from 'lucide-react';
import { Bell, ContactRound, LayoutDashboard, Tags } from 'lucide-react';
import { contactsAdminRoutes } from '@/features/contacts/admin/constants/routes';

export type ContactsAdminNavItem = {
  labelAr: string;
  href: string;
  icon: LucideIcon;
};

export type ContactsAdminNavGroup = {
  key: 'directory' | 'configuration';
  labelAr: string;
  icon: LucideIcon;
  items: ContactsAdminNavItem[];
};

export const contactsAdminOverviewItem: ContactsAdminNavItem = {
  labelAr: 'جهات الاتصال',
  href: contactsAdminRoutes.overview,
  icon: LayoutDashboard,
};

export const contactsAdminNavGroups: ContactsAdminNavGroup[] = [
  {
    key: 'directory',
    labelAr: 'الدليل',
    icon: ContactRound,
    items: [{ labelAr: 'الشركاء', href: contactsAdminRoutes.partners, icon: ContactRound }],
  },
  {
    key: 'configuration',
    labelAr: 'التهيئة',
    icon: Tags,
    items: [
      { labelAr: 'التصنيفات', href: contactsAdminRoutes.categories, icon: Tags },
      { labelAr: 'إعدادات الإشعارات', href: contactsAdminRoutes.settings, icon: Bell },
    ],
  },
];

export function flattenContactsNavItems(group: ContactsAdminNavGroup): ContactsAdminNavItem[] {
  return group.items;
}

/** True for standalone Contacts app routes. */
export function isContactsAdminNavPath(pathname: string): boolean {
  return pathname === '/contacts' || pathname.startsWith('/contacts/');
}
