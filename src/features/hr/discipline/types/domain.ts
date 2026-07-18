export type HRViolationDeductionKind = 'none' | 'amount' | 'hours' | 'day';
export type HRViolationCaseStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'executed' | 'closed';
export type HRDisciplineNoticeKind = 'verbal' | 'first' | 'second' | 'final';
export type HRInvestigationResult = 'pending' | 'proven' | 'not_proven';
export type HRInvestigationRecommendation = 'warning' | 'deduction';
export type HRInvestigationDeductionType = 'days' | 'hours' | 'fixed_amount';
export type HRPenaltyType = 'reprimand' | 'warning' | 'monetary' | 'suspension' | 'termination_recommendation';
export type HRAppealChannel = 'in_person' | 'written' | 'email' | 'phone' | 'system';
export type HRAppealStatus = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
export type HRDeductionStatus = 'ready' | 'posted' | 'calculated' | 'cancelled';
export type HRApproverRole = 'manager' | 'hr' | 'executive';

import { AR_STATUS } from '@/shared/i18n/ar';

export interface HRViolationTypeRecord {
  id: string; code: string; nameAr: string; nameEn: string;
  sortOrder: number; isActive: boolean;
  hasDeduction: boolean; deductionKind: HRViolationDeductionKind; deductionValue: number;
  needsWarning: boolean; needsInvestigation: boolean; needsApproval: boolean;
  approvalTemplateId: string | null; updatedAt: string;
}

export interface HRViolationCaseRecord {
  id: string; caseNumber: string;
  employeeId: string; employeeNameAr: string; employeeNameEn: string;
  date: string; description: string; notes: string; attachmentsNote: string;
  violationTypeId: string; typeCode: string; typeNameAr: string;
  typeHasDeduction: boolean; typeDeductionKind: HRViolationDeductionKind; typeDeductionValue: number;
  typeNeedsWarning: boolean; typeNeedsInvestigation: boolean; typeNeedsApproval: boolean;
  approvalTemplateId: string | null;
  status: HRViolationCaseStatus;
  requiredApprovers: HRApproverRole[];
  currentApprovalIndex: number;
  approvalLog: { role: HRApproverRole; action: 'approved' | 'rejected' | 'edit_requested'; note?: string; at: string }[];
  postedToPayroll: boolean;
  createdAt: string; updatedAt: string;
}

export interface HRDisciplineNoticeRecord {
  id: string; employeeId: string; employeeNameAr: string;
  kind: HRDisciplineNoticeKind; reasonAr: string; date: string;
  linkedCaseId: string; attachmentsNote: string; createdAt: string;
}

/** نطاق استلام التعميم */
export type HRDisciplineCircularAudience = 'all' | 'employees' | 'branch' | 'department';

export interface HRDisciplineCircularRecord {
  id: string;
  date: string;
  titleAr: string;
  bodyAr: string;
  audience: HRDisciplineCircularAudience;
  /** عند `audience === 'employees'` */
  targetEmployeeIds: string[];
  /** عند `audience === 'branch'` — واحد أو أكثر */
  branchIds: string[];
  /** أسماء الفروع مفصولة بـ «،» للعرض والبحث */
  branchNamesArSnapshot: string;
  /** عند `audience === 'department'` — واحد أو أكثر */
  departmentIds: string[];
  departmentNamesArSnapshot: string;
  /** وصف مختصر يظهر في البطاقات والجدول */
  audienceSummaryAr: string;
  /** وقت إرسال التعميم إلى المستلمين؛ `null` = لم يُرسل بعد */
  sentAt: string | null;
  createdAt: string;
}

export interface HRDisciplineInvestigationRecord {
  id: string; caseId: string; caseNumber: string;
  employeeId: string; employeeNameAr: string;
  investigatorEmployeeId: string | null;
  investigatorName: string; date: string;
  employeeStatement: string; witnessStatement: string;
  result: HRInvestigationResult; recommendation: string;
  recommendationType: HRInvestigationRecommendation | null;
  deductionType: HRInvestigationDeductionType | null;
  deductionValue: number | null;
  createdAt: string; updatedAt: string;
}

export interface HRDisciplinePenaltyRecord {
  id: string; employeeId: string; employeeNameAr: string;
  caseId: string; caseNumber: string;
  penaltyType: HRPenaltyType; decisionDate: string; notes: string; createdAt: string;
}

export interface HRDisciplinePayrollDeductionRecord {
  id: string; caseId: string; caseNumber: string;
  employeeId: string; employeeNameAr: string;
  reasonAr: string; deductionKind: HRViolationDeductionKind;
  amount: number; month: string;
  status: HRDeductionStatus; createdAt: string; updatedAt: string;
}

export interface HRDisciplineAppealRecord {
  id: string; caseId: string; caseNumber: string;
  employeeId: string; employeeNameAr: string;
  date: string; channel: HRAppealChannel; status: HRAppealStatus;
  grounds: string; responseNote: string; createdAt: string; updatedAt: string;
}

// Nav
export const hrDisciplineSections = [
  { slug: 'violation-types',      titleAr: 'أنواع المخالفات',      titleEn: 'Violation Types' },
  { slug: 'approval-assignment',  titleAr: 'إسناد الموافقات',        titleEn: 'Approval Assignment' },
  { slug: 'violation-cases',      titleAr: 'تسجيل  المخالفات',      titleEn: 'Violation Cases' },
  { slug: 'notices',              titleAr: 'الإنذارات والتحذيرات', titleEn: 'Notices' },
  { slug: 'circulars',            titleAr: 'التعميمات',            titleEn: 'Circulars' },
  { slug: 'investigations',       titleAr: 'التحقيقات',            titleEn: 'Investigations' },
  { slug: 'deductions',           titleAr: 'كشف الخصومات',          titleEn: 'Payroll Deductions' },
  { slug: 'appeals',              titleAr: 'التظلمات',             titleEn: 'Appeals' },
  { slug: 'audit-log',            titleAr: 'سجل العمليات',          titleEn: 'Audit Log' },
] as const;

export type HRDisciplineSection = (typeof hrDisciplineSections)[number]['slug'];
export function isDisciplineSection(s: string): s is HRDisciplineSection {
  return hrDisciplineSections.some(x => x.slug === s);
}

export const hrDisciplineNavGroups: { labelAr: string; items: { slug: HRDisciplineSection; labelAr: string }[] }[] = [
  {
    labelAr: 'مسارات الإنظباط', items: [
      { slug: 'violation-cases',  labelAr: 'سجل المخالفات' },
      { slug: 'notices',          labelAr: 'الإنذارات' },
      { slug: 'circulars',        labelAr: 'التعميمات' },
      { slug: 'investigations',   labelAr: 'التحقيقات' },
      { slug: 'appeals',          labelAr: 'التظلمات' },
    ],
  },
  {
    labelAr: 'الإعدادات', items: [
      { slug: 'violation-types',     labelAr: 'أنواع المخالفات' },
      { slug: 'approval-assignment', labelAr: 'إسناد الموافقات' },
    ],
  },
  {
    labelAr: '', items: [
      { slug: 'deductions', labelAr: 'كشف الخصومات' },
    ],
  },
];

// Label maps
export const NOTICE_KIND_LABELS: Record<HRDisciplineNoticeKind, string> = {
  verbal: 'شفهي', first: 'إنذار أول', second: 'إنذار ثانٍ', final: 'إنذار نهائي',
};
/** ترتيب عرض تبويبات التصفية في الإنذارات */
export const NOTICE_KIND_FILTER_ORDER: HRDisciplineNoticeKind[] = ['verbal', 'first', 'second', 'final'];

export const CIRCULAR_AUDIENCE_LABELS: Record<HRDisciplineCircularAudience, string> = {
  all: 'جميع الموظفين',
  employees: 'موظفون محددون',
  branch: 'فرع',
  department: 'قسم',
};
/** ترتيب تبويبات نطاق التعميم في الواجهة */
export const CIRCULAR_AUDIENCE_FILTER_ORDER: HRDisciplineCircularAudience[] = ['all', 'employees', 'branch', 'department'];

export const INVESTIGATION_RESULT_LABELS: Record<HRInvestigationResult, string> = {
  pending: 'قيد التحقيق', proven: 'ثبتت المخالفة', not_proven: 'لم تثبت',
};
export const INVESTIGATION_RECOMMENDATION_LABELS: Record<HRInvestigationRecommendation, string> = {
  warning: 'توجيه إنذار', deduction: 'استقطاع',
};
export const INVESTIGATION_DEDUCTION_TYPE_LABELS: Record<HRInvestigationDeductionType, string> = {
  days: 'أيام', hours: 'ساعات', fixed_amount: 'مبلغ ثابت',
};

export function normalizeInvestigationDeductionType(
  raw: string | null | undefined,
): HRInvestigationDeductionType | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === 'days' || trimmed === 'day') return 'days';
  if (trimmed === 'hours' || trimmed === 'hour') return 'hours';
  if (trimmed === 'fixed_amount' || trimmed === 'fixedamount' || trimmed === 'amount') return 'fixed_amount';
  if (trimmed in INVESTIGATION_DEDUCTION_TYPE_LABELS) {
    return trimmed as HRInvestigationDeductionType;
  }
  return null;
}

export function formatInvestigationDeductionType(
  type: HRInvestigationDeductionType | string | null | undefined,
): string | null {
  const normalized = typeof type === 'string' ? normalizeInvestigationDeductionType(type) : type;
  if (!normalized) return typeof type === 'string' && type.trim() ? type.trim() : null;
  return INVESTIGATION_DEDUCTION_TYPE_LABELS[normalized];
}

export function formatInvestigationDeductionValue(
  value: number | string | null | undefined,
): string | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (Number.isNaN(n)) return String(value).trim() || null;
  return Number.isInteger(n) ? String(n) : String(n);
}

export const INVESTIGATION_RESULT_FILTER_ORDER: HRInvestigationResult[] = ['pending', 'proven', 'not_proven'];
export const PENALTY_TYPE_LABELS: Record<HRPenaltyType, string> = {
  reprimand: 'توبيخ', warning: 'إنذار رسمي', monetary: 'غرامة مالية',
  suspension: 'إيقاف عن العمل', termination_recommendation: 'توصية بالإنهاء',
};
export const APPEAL_CHANNEL_LABELS: Record<HRAppealChannel, string> = {
  in_person: 'حضوري', written: 'مكتوب', email: 'بريد إلكتروني', phone: 'هاتفي', system: 'النظام',
};
export const APPEAL_STATUS_LABELS: Record<HRAppealStatus, string> = {
  pending: AR_STATUS.pending,
  under_review: AR_STATUS.inReview,
  accepted: AR_STATUS.accepted,
  rejected: AR_STATUS.rejected,
  withdrawn: AR_STATUS.withdrawn,
};
export const APPEAL_STATUS_FILTER_ORDER: HRAppealStatus[] = ['pending', 'under_review', 'accepted', 'rejected', 'withdrawn'];
/** تسميات عربية لمسارات الإنظباط الإداري: مسودة → تقديم → سلسلة الموافقات → قرار → تنفيذ/إغلاق. */
export const CASE_STATUS_LABELS: Record<HRViolationCaseStatus, string> = {
  draft: AR_STATUS.draft,
  submitted: 'مُقدَّم',
  under_review: 'قيد الاعتماد',
  approved: AR_STATUS.approvedFormal,
  rejected: AR_STATUS.rejected,
  executed: 'تم التنفيذ',
  closed: 'مغلق',
};
export const CASE_STATUS_COLORS: Record<HRViolationCaseStatus, string> = {
  draft: 'text-muted-foreground border-border bg-muted/30',
  submitted: 'text-primary border-primary/25 bg-primary/5 dark:border-primary/40 dark:bg-primary/15',
  under_review: 'text-warning border-warning/30 bg-warning/10 dark:border-warning/40 dark:bg-warning/10',
  approved: 'text-success border-success/30 bg-success/10 dark:border-success/40 dark:bg-success/10',
  rejected: 'text-destructive border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/10',
  executed: 'text-gold border-gold/30 bg-gold/10 dark:border-gold/40 dark:bg-gold/10',
  closed: 'text-muted-foreground border-border bg-muted/30',
};

/** ترتيب عرض مراحل التصفية في الواجهة (مسار الطلب الإداري) */
export const CASE_STATUS_FILTER_ORDER: HRViolationCaseStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'executed',
  'closed',
  'rejected',
];

/** خط سير الحالة الرئيسي (بدون مرفوض) لعرض شريط التقدم */
export const CASE_MAIN_FLOW: HRViolationCaseStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'executed',
  'closed',
];

/** أين تقف الحالة ضمن المسار الرئيسي (−1 إن لم تكن في المسار، مثل مرفوض) */
export function caseMainFlowIndex(status: HRViolationCaseStatus): number {
  if (status === 'rejected') return -1;
  const i = CASE_MAIN_FLOW.indexOf(status);
  return i >= 0 ? i : CASE_MAIN_FLOW.length - 1;
}
export const DEDUCTION_KIND_LABELS: Record<HRViolationDeductionKind, string> = {
  none: 'لا يوجد', amount: 'مبلغ ثابت', hours: 'بالساعات', day: 'بالأيام',
};
export const DEDUCTION_STATUS_LABELS: Record<HRDeductionStatus, string> = {
  ready: 'جاهز', posted: 'مُدرَج', calculated: 'محسوب', cancelled: AR_STATUS.cancelledShort,
};
