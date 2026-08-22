import type { ContactsCompanySettings } from '@/features/contacts/admin/notifications/lib/api/contacts-settings';
import type {
  NotificationToggleGroup,
  NotificationToggleItem,
} from '@/features/system/organization/pages/_shared/constants/notification-groups';

export type ContactsNotificationKey = Exclude<
  keyof ContactsCompanySettings,
  'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export const CONTACTS_NOTIFICATION_GROUPS: NotificationToggleGroup[] = [
  {
    label: 'عام',
    items: [
      {
        key: 'notificationsEnabled',
        label: 'تفعيل إشعارات جهات الاتصال',
        description: 'عند الإيقاف تُعطّل كل إشعارات الشركاء لهذه الشركة',
      },
    ] as NotificationToggleItem[],
  },
  {
    label: 'الشركاء',
    items: [
      { key: 'notifyPartnerCreated', label: 'إنشاء جهة اتصال' },
      { key: 'notifyPartnerRegistered', label: 'تسجيل بوابة عميل' },
      { key: 'notifyPartnerStatusChanged', label: 'تغيير الحالة' },
    ] as NotificationToggleItem[],
  },
  {
    label: 'CRM',
    items: [
      {
        key: 'notifyPartnerActivityCreated',
        label: 'نشاط CRM جديد',
        description: 'معطّل افتراضياً',
      },
      {
        key: 'notifyPartnerNoteCreated',
        label: 'ملاحظة جديدة',
        description: 'معطّل افتراضياً',
      },
    ] as NotificationToggleItem[],
  },
];
