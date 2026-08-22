export const STORE_SOURCE_KIND_LABELS: Record<string, string> = {
  store_order_placed: 'طلب جديد',
  store_order_confirmed: 'تأكيد طلب',
  store_order_processing: 'معالجة طلب',
  store_order_shipped: 'شحن طلب',
  store_order_delivered: 'تسليم طلب',
  store_order_cancelled: 'إلغاء طلب',
  store_order_refunded: 'استرداد طلب',
  store_payment_updated: 'تحديث دفع',
  store_contact_message_received: 'رسالة تواصل',
};

export const STORE_SEVERITY_DOT_CLASS: Record<string, string> = {
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-destructive',
};
