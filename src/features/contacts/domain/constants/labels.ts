import type {
  PartnerActivityStatus,
  PartnerActivityType,
  PartnerAddressType,
  PartnerChannelType,
  PartnerRelationType,
  PartnerStatus,
} from '@/features/contacts/domain/types/partner';

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  draft: 'مسودة',
  active: 'نشط',
  inactive: 'غير نشط',
  archived: 'مؤرشف',
};

export const PARTNER_ADDRESS_TYPE_LABELS: Record<PartnerAddressType, string> = {
  main: 'رئيسي',
  billing: 'فوترة',
  shipping: 'شحن',
  warehouse: 'مستودع',
  branch: 'فرع',
  other: 'أخرى',
};

export const PARTNER_CHANNEL_TYPE_LABELS: Record<PartnerChannelType, string> = {
  mobile: 'جوال',
  phone: 'هاتف',
  email: 'بريد',
  website: 'موقع',
  whatsapp: 'واتساب',
  linkedin: 'LinkedIn',
  twitter: 'X',
  facebook: 'فيسبوك',
  instagram: 'إنستغرام',
  other: 'أخرى',
};

export const PARTNER_RELATION_TYPE_LABELS: Record<PartnerRelationType, string> = {
  parent_company: 'شركة أم',
  child_contact: 'جهة فرعية',
  billing_contact: 'جهة فوترة',
  shipping_contact: 'جهة شحن',
  emergency_contact: 'طوارئ',
  guardian: 'ولي أمر',
  owner: 'مالك',
  other: 'أخرى',
};

export const PARTNER_ACTIVITY_TYPE_LABELS: Record<PartnerActivityType, string> = {
  note: 'ملاحظة',
  call: 'مكالمة',
  meeting: 'اجتماع',
  email: 'بريد',
  task: 'مهمة',
  message: 'رسالة',
};

export const PARTNER_ACTIVITY_STATUS_LABELS: Record<PartnerActivityStatus, string> = {
  planned: 'مخطط',
  done: 'منجز',
  cancelled: 'ملغى',
};
