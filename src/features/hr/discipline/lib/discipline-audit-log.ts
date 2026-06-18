import type {
  HRDisciplineAppealRecord,
  HRDisciplineInvestigationRecord,
  HRViolationCaseRecord,
} from './types';
import {
  APPEAL_CHANNEL_LABELS,
  APPEAL_STATUS_LABELS,
  CASE_STATUS_LABELS,
  INVESTIGATION_RESULT_LABELS,
} from './types';

export type HRDisciplineAuditCategory = 'violation_case' | 'investigation' | 'appeal';

export type HRDisciplineAuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'submit'
  | 'approve'
  | 'reject'
  | 'request_edit'
  | 'payroll_posted';

export interface HRDisciplineAuditLogEntry {
  id: string;
  occurredAt: string;
  actorNameAr: string;
  category: HRDisciplineAuditCategory;
  actionType: HRDisciplineAuditAction;
  recordId: string;
  /** مرجع مختصر للعرض (مثل رقم القضية) */
  recordRefAr: string;
  /** حالة السجل بعد العملية */
  recordStatusAfterAr: string;
  previousSnapshotAr: string;
  currentSnapshotAr: string;
}

export const AUDIT_CATEGORY_LABELS_AR: Record<HRDisciplineAuditCategory, string> = {
  violation_case: 'سجل المخالفات',
  investigation: 'التحقيقات',
  appeal: 'التظلمات',
};

export const AUDIT_ACTION_LABELS_AR: Record<HRDisciplineAuditAction, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  submit: 'تقديم',
  approve: 'اعتماد',
  reject: 'رفض',
  request_edit: 'طلب تعديل',
  payroll_posted: 'إدراج في الرواتب',
};

/** ترتيب تبويبات «الحالات» (نوع العملية) في شريط الفلاتر */
export const AUDIT_ACTION_FILTER_ORDER: HRDisciplineAuditAction[] = [
  'create',
  'update',
  'delete',
  'submit',
  'approve',
  'reject',
  'request_edit',
  'payroll_posted',
];

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function summarizeViolationCase(c: HRViolationCaseRecord): string {
  return [
    `رقم القضية: ${c.caseNumber}`,
    `الموظف: ${c.employeeNameAr}`,
    `التاريخ: ${c.date}`,
    `نوع المخالفة: ${c.typeNameAr}`,
    `الحالة: ${CASE_STATUS_LABELS[c.status]}`,
    `الوصف: ${clip(c.description, 280)}`,
  ].join('\n');
}

export function summarizeInvestigation(i: HRDisciplineInvestigationRecord): string {
  return [
    `رقم القضية: ${i.caseNumber}`,
    `الموظف: ${i.employeeNameAr}`,
    `تاريخ التحقيق: ${i.date}`,
    `المحقق: ${i.investigatorName}`,
    `النتيجة: ${INVESTIGATION_RESULT_LABELS[i.result]}`,
    `التوصية: ${clip(i.recommendation, 200)}`,
    `إفادة الموظف: ${clip(i.employeeStatement, 160)}`,
    `إفادة الشهود: ${clip(i.witnessStatement, 160)}`,
  ].join('\n');
}

export function summarizeAppeal(a: HRDisciplineAppealRecord): string {
  return [
    `رقم القضية: ${a.caseNumber}`,
    `الموظف: ${a.employeeNameAr}`,
    `تاريخ التظلم: ${a.date}`,
    `القناة: ${APPEAL_CHANNEL_LABELS[a.channel]}`,
    `الحالة: ${APPEAL_STATUS_LABELS[a.status]}`,
    `أسباب التظلم: ${clip(a.grounds, 240)}`,
    `ملاحظة الرد: ${clip(a.responseNote, 160)}`,
  ].join('\n');
}
