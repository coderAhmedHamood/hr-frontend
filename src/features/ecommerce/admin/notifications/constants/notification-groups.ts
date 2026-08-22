import type { StoreCompanySettings } from '@/features/ecommerce/admin/notifications/lib/api/store-settings';
import type {
  NotificationToggleGroup,
  NotificationToggleItem,
} from '@/features/system/organization/pages/_shared/constants/notification-groups';

export type StoreNotificationKey = Exclude<
  keyof StoreCompanySettings,
  'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export const STORE_NOTIFICATION_GROUPS: NotificationToggleGroup[] = [
  {
    label: 'عام',
    items: [
      {
        key: 'notificationsEnabled',
        label: 'تفعيل إشعارات المتجر',
        description: 'عند الإيقاف تُعطّل كل إشعارات الطلبات والرسائل لهذه الشركة',
      },
    ] as NotificationToggleItem[],
  },
  {
    label: 'الطلبات',
    items: [
      { key: 'notifyOrderPlaced', label: 'طلب جديد' },
      { key: 'notifyOrderConfirmed', label: 'تأكيد الطلب' },
      {
        key: 'notifyOrderProcessing',
        label: 'بدء المعالجة',
        description: 'معطّل افتراضياً — فعّله عند الحاجة',
      },
      { key: 'notifyOrderShipped', label: 'شحن الطلب' },
      { key: 'notifyOrderDelivered', label: 'تسليم الطلب' },
      { key: 'notifyOrderCancelled', label: 'إلغاء الطلب' },
      { key: 'notifyOrderRefunded', label: 'استرداد الطلب' },
    ] as NotificationToggleItem[],
  },
  {
    label: 'الدفع',
    items: [{ key: 'notifyPaymentUpdated', label: 'تحديث حالة الدفع' }] as NotificationToggleItem[],
  },
  {
    label: 'رسائل التواصل',
    items: [
      { key: 'notifyContactMessageReceived', label: 'رسالة تواصل جديدة' },
    ] as NotificationToggleItem[],
  },
];
