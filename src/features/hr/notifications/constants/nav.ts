import { Bell, Send } from 'lucide-react';

export const hrNotificationsNavGroups: {
  labelAr: string;
  items: { labelAr: string; href: string; icon: typeof Bell }[];
}[] = [
  {
    labelAr: 'الإدارة',
    items: [
      {
        labelAr: 'إرسال وإدارة الإشعارات',
        href: '/hr/notifications/admin',
        icon: Send,
      },
    ],
  },
];

export function isHrNotificationsNavPath(pathname: string): boolean {
  return pathname.startsWith('/hr/notifications/');
}
