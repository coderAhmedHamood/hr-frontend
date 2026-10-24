import type { EmailMessageStatus } from '@/features/system/email/lib/api/email-messages';

export const EMAIL_STATUS_LABELS: Record<EmailMessageStatus, string> = {
  pending: 'بانتظار الإرسال',
  sending: 'جارٍ الإرسال',
  sent: 'أُرسلت',
  failed: 'فشلت',
  skipped: 'تم تخطيها',
  cancelled: 'أُلغيت',
};

export const EMAIL_STATUS_TONE: Record<
  EmailMessageStatus,
  'success' | 'warning' | 'destructive' | 'subtle' | 'outline'
> = {
  pending: 'outline',
  sending: 'warning',
  sent: 'success',
  failed: 'destructive',
  skipped: 'subtle',
  cancelled: 'subtle',
};

export const EMAIL_SKIP_REASON_LABELS: Record<string, string> = {
  email_disabled_in_organization_settings: 'البريد غير مفعّل في إعدادات المؤسسة',
  smtp_not_configured: 'إعداد SMTP غير مكتمل',
  email_disabled_for_event: 'هذا الحدث موقوف من إعدادات البريد',
  hr_event_notification_disabled: 'إشعار الموارد البشرية لهذا الحدث موقوف',
  send_failed: 'فشل الإرسال',
};

export function emailSkipReasonLabel(reason: string | null): string | null {
  if (!reason) return null;
  return EMAIL_SKIP_REASON_LABELS[reason] ?? reason;
}

export const EMAIL_STATUS_FILTER_OPTIONS: { value: EmailMessageStatus | ''; label: string }[] = [
  { value: '', label: 'كل الحالات' },
  { value: 'sent', label: EMAIL_STATUS_LABELS.sent },
  { value: 'failed', label: EMAIL_STATUS_LABELS.failed },
  { value: 'pending', label: EMAIL_STATUS_LABELS.pending },
  { value: 'sending', label: EMAIL_STATUS_LABELS.sending },
  { value: 'skipped', label: EMAIL_STATUS_LABELS.skipped },
  { value: 'cancelled', label: EMAIL_STATUS_LABELS.cancelled },
];
