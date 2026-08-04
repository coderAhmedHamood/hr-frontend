export const EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES = [
  { value: 'id_card', label: 'الهوية الوطنية' },
  { value: 'passport', label: 'جواز السفر' },
  { value: 'iqama', label: 'الإقامة' },
  { value: 'contract', label: 'عقد عمل' },
  { value: 'contract_signed', label: 'عقد عمل موقّع' },
  { value: 'cash_receipt_signed', label: 'سند راتب موقّع' },
  { value: 'resignation_signed', label: 'استقالة موقّعة' },
  { value: 'clearance_signed', label: 'إخلاء طرف موقّع' },
  { value: 'mobile_circular_signed', label: 'تعميم جوال موقّع' },
  { value: 'notif_leave_signed', label: 'إشعار إجازة موقّع' },
  { value: 'notif_discipline_signed', label: 'إشعار انضباط موقّع' },
  { value: 'notif_payroll_signed', label: 'إشعار رواتب موقّع' },
  { value: 'notif_contract_signed', label: 'إشعار عقود موقّع' },
  { value: 'notif_attendance_signed', label: 'إشعار حضور موقّع' },
  { value: 'notif_advance_signed', label: 'إشعار سلف موقّع' },
  { value: 'notif_announcement_signed', label: 'إشعار تعميم موقّع' },
  { value: 'notif_system_signed', label: 'إشعار نظام موقّع' },
  { value: 'certificate', label: 'شهادة' },
  { value: 'license', label: 'رخصة / تصريح' },
  { value: 'bank', label: 'مستند بنكي' },
  { value: 'payslip', label: 'قسيمة راتب' },
  { value: 'medical', label: 'تقرير طبي' },
  { value: 'other', label: 'أخرى' },
] as const;

/** Document types shown under employee salary / payslips section. */
export const SALARY_ATTACHMENT_DOCUMENT_TYPES = ['payslip', 'bank'] as const;

export type EmployeeAttachmentDocumentType =
  (typeof EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES)[number]['value'];

const DOCUMENT_TYPE_LABEL_MAP = Object.fromEntries(
  EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES.map((item) => [item.value, item.label]),
) as Record<string, string>;

export function employeeAttachmentDocumentTypeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return DOCUMENT_TYPE_LABEL_MAP[value] ?? value;
}

export const EMPLOYEE_ATTACHMENT_UPLOAD_CATEGORY_LABELS: Record<string, string> = {
  image: 'صورة',
  pdf: 'PDF',
  document: 'مستند',
  spreadsheet: 'جدول بيانات',
  other: 'ملف',
};

export function employeeAttachmentUploadCategoryLabel(value: string | null | undefined): string {
  if (!value) return 'ملف';
  return EMPLOYEE_ATTACHMENT_UPLOAD_CATEGORY_LABELS[value] ?? value;
}

/** High-level library buckets for quick filtering in the attachments UI. */
export const EMPLOYEE_ATTACHMENT_LIBRARY_GROUPS = [
  {
    id: 'all',
    label: 'الكل',
    types: [] as readonly string[],
  },
  {
    id: 'identity',
    label: 'هوية',
    types: ['id_card', 'passport', 'iqama'] as const,
  },
  {
    id: 'contracts',
    label: 'عقود',
    types: ['contract', 'contract_signed'] as const,
  },
  {
    id: 'signed_forms',
    label: 'نماذج موقّعة',
    types: [
      'resignation_signed',
      'clearance_signed',
      'mobile_circular_signed',
      'cash_receipt_signed',
    ] as const,
  },
  {
    id: 'notifications',
    label: 'إشعارات موقّعة',
    types: [
      'notif_leave_signed',
      'notif_discipline_signed',
      'notif_payroll_signed',
      'notif_contract_signed',
      'notif_attendance_signed',
      'notif_advance_signed',
      'notif_announcement_signed',
      'notif_system_signed',
    ] as const,
  },
  {
    id: 'payroll',
    label: 'رواتب',
    types: ['payslip', 'bank', 'cash_receipt_signed'] as const,
  },
  {
    id: 'other',
    label: 'أخرى',
    types: ['certificate', 'license', 'medical', 'other'] as const,
  },
] as const;

export type EmployeeAttachmentLibraryGroupId =
  (typeof EMPLOYEE_ATTACHMENT_LIBRARY_GROUPS)[number]['id'];

/** Presets for “last N related attachments” panels on domain detail cards. */
export const RELATED_EMPLOYEE_ATTACHMENT_PRESETS = {
  discipline: {
    title: 'مرفقات الانضباط الأخيرة',
    libraryGroup: 'notifications' as const,
    documentTypes: ['notif_discipline_signed'] as const,
  },
  contracts: {
    title: 'مرفقات العقود الأخيرة',
    libraryGroup: 'contracts' as const,
    documentTypes: ['contract', 'contract_signed', 'notif_contract_signed'] as const,
  },
  payroll: {
    title: 'مرفقات الرواتب الأخيرة',
    libraryGroup: 'payroll' as const,
    documentTypes: ['payslip', 'bank', 'cash_receipt_signed', 'notif_payroll_signed'] as const,
  },
  notifications: {
    title: 'الإشعارات الموقّعة الأخيرة',
    libraryGroup: 'notifications' as const,
    documentTypes: [
      'notif_leave_signed',
      'notif_discipline_signed',
      'notif_payroll_signed',
      'notif_contract_signed',
      'notif_attendance_signed',
      'notif_advance_signed',
      'notif_announcement_signed',
      'notif_system_signed',
    ] as const,
  },
  signedForms: {
    title: 'النماذج الموقّعة الأخيرة',
    libraryGroup: 'signed_forms' as const,
    documentTypes: [
      'resignation_signed',
      'clearance_signed',
      'mobile_circular_signed',
      'cash_receipt_signed',
    ] as const,
  },
} as const;

export type RelatedEmployeeAttachmentPresetId = keyof typeof RELATED_EMPLOYEE_ATTACHMENT_PRESETS;
