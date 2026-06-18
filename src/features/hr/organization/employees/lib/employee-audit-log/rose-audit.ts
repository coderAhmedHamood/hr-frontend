import type { EmployeeAuditRowInput, EmployeeAuditScope } from '@/features/hr/organization/employees/lib/employee-audit-log/types';
import type { RoseTradingFormTab } from '@/features/hr/organization/employees/lib/employee-rose-forms/types';

const SKIP = new Set(['id', 'employeeId', 'createdAt', 'updatedAt']);

const ROSE_FIELD_LABELS: Record<string, string> = {
  documentDate: 'تاريخ النموذج',
  effectiveResignationDate: 'آخر يوم عمل (استقالة)',
  reasonAr: 'سبب الاستقالة',
  notesAr: 'ملاحظات',
  approvedByAr: 'المعتمد',
  referenceNo: 'المرجع',
  lastWorkingDay: 'آخر يوم عمل',
  financeClearAr: 'المالية',
  hrClearAr: 'الموارد البشرية',
  itClearAr: 'تقنية المعلومات',
  adminClearAr: 'الإدارة',
  settlementPeriodAr: 'نطاق المخالصة',
  salaryAndRightsAr: 'الراتب والحقوق',
  deductionsAr: 'الاستقطاعات',
  netAmountAr: 'الصافي',
  declarationAr: 'نص الإقرار',
  serviceFrom: 'بداية الخدمة',
  serviceTo: 'نهاية الخدمة',
  jobTitleAr: 'المسمى في الشهادة',
  dutiesSummaryAr: 'ملخص المهام',
  certificatePurposeAr: 'الغرض من الشهادة',
  issuedToAr: 'التوجيه',
};

const SCOPE_SHORT: Record<EmployeeAuditScope, string> = {
  personal: 'شخصي',
  permissions: 'صلاحيات',
  'rose-resignation': 'استقالة',
  'rose-clearance': 'إخلاء طرف',
  'rose-settlement': 'مخالصة',
  'rose-experience': 'شهادة خبرة',
};

function clip(s: string, max = 1200): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function asStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return clip(JSON.stringify(v));
  return clip(String(v));
}

function labelForRoseField(scope: EmployeeAuditScope, key: string): string {
  return ROSE_FIELD_LABELS[key] ?? `${SCOPE_SHORT[scope]} — ${key}`;
}

export function roseTabToScope(tab: RoseTradingFormTab): EmployeeAuditScope {
  if (tab === 'resignation') return 'rose-resignation';
  if (tab === 'clearance') return 'rose-clearance';
  if (tab === 'settlement') return 'rose-settlement';
  return 'rose-experience';
}

export function diffRoseRecordAudit(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  scope: EmployeeAuditScope,
): EmployeeAuditRowInput[] {
  const out: EmployeeAuditRowInput[] = [];

  if (!before && after) {
    for (const k of Object.keys(after)) {
      if (SKIP.has(k)) continue;
      const nv = asStr(after[k]);
      if (!nv) continue;
      out.push({
        action: 'create',
        scope,
        fieldKey: k,
        labelAr: labelForRoseField(scope, k),
        oldValue: '',
        newValue: nv,
      });
    }
    return out;
  }

  if (before && !after) {
    for (const k of Object.keys(before)) {
      if (SKIP.has(k)) continue;
      const ov = asStr(before[k]);
      if (!ov) continue;
      out.push({
        action: 'delete',
        scope,
        fieldKey: k,
        labelAr: labelForRoseField(scope, k),
        oldValue: ov,
        newValue: '',
      });
    }
    return out;
  }

  if (before && after) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const k of keys) {
      if (SKIP.has(k)) continue;
      const ov = asStr(before[k]);
      const nv = asStr(after[k]);
      if (ov === nv) continue;
      out.push({
        action: 'update',
        scope,
        fieldKey: k,
        labelAr: labelForRoseField(scope, k),
        oldValue: ov,
        newValue: nv,
      });
    }
  }

  return out;
}
