export const EMPLOYEE_ATTACHMENT_DOCUMENT_TYPES = [
  { value: 'id_card', label: 'الهوية الوطنية' },
  { value: 'passport', label: 'جواز السفر' },
  { value: 'iqama', label: 'الإقامة' },
  { value: 'contract', label: 'عقد عمل' },
  { value: 'certificate', label: 'شهادة' },
  { value: 'license', label: 'رخصة / تصريح' },
  { value: 'bank', label: 'مستند بنكي' },
  { value: 'medical', label: 'تقرير طبي' },
  { value: 'other', label: 'أخرى' },
] as const;

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
