export type {
  HRDepartmentEntity,
  HRRequestFieldKind,
  HRRequestFieldOption,
  HRRequestFieldDefinition,
  HRRequestTemplateEntity,
  HRApprovalStageMode,
  HRApprovalParallelRule,
  HRApprovalStage,
  HRRequestSubtype,
  HRRequestTypeCategory,
  HRRequestTypeEntity,
  HRSubmissionApprovalStageState,
  HRSubmissionApprovalStageSnapshot,
  HRSubmissionApprovalSnapshot,
  HRRequestSubmissionRecord,
  HRApprovalTemplateStage,
  HRDisciplineApprovalAssignmentLinkKind,
  HRApprovalAssignmentTemplate,
} from '@/features/hr/requests/types/domain';

export { HR_REQUEST_TYPE_CATEGORIES } from '@/features/hr/requests/types/domain';

import { AR_FORMAL_APPROVAL_STATUS_LABELS, AR_STATUS, approvalModeLabelAr } from '@/shared/i18n/ar';
import type {
  HRRequestTemplateEntity,
  HRApprovalStage,
  HRRequestTypeCategory,
  HRApprovalStageMode,
  HRSubmissionApprovalStageState,
  HRSubmissionApprovalStageSnapshot,
  HRSubmissionApprovalSnapshot,
  HRApprovalAssignmentTemplate,
  HRApprovalTemplateStage,
} from '@/features/hr/requests/types/domain';
import { HR_REQUEST_TYPE_CATEGORIES } from '@/features/hr/requests/types/domain';

// ─── Constants ────────────────────────────────────────────────────────────────

export const HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID = '__ALL_DEPARTMENTS__';
export const HR_COMPANY_ROOT_ID = '__ROOT__';

// ─── Departments ──────────────────────────────────────────────────────────────


// ─── Form fields ──────────────────────────────────────────────────────────────




// ─── Templates ────────────────────────────────────────────────────────────────


/** حقول نموذج الطلب العامة — لا يُربط نوع الطلب بقالب منفصل في الواجهة */
export function getDefaultHRRequestFormTemplate(
  templates: HRRequestTemplateEntity[],
): HRRequestTemplateEntity | undefined {
  return templates.find((t) => t.isUniversalDefault) ?? templates[0];
}

// ─── Approval stages ──────────────────────────────────────────────────────────




export function validateApprovalStages(stages: HRApprovalStage[]): string | null {
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i]!;
    if (s.approverEmployeeIds.length === 0) {
      return `المرحلة ${i + 1}: يجب تحديد معتمد واحد على الأقل`;
    }
    if (s.mode === 'parallel' && s.parallelRule?.kind === 'count') {
      const req = s.parallelRule.required ?? 0;
      if (req < 1 || req > s.approverEmployeeIds.length) {
        return `المرحلة ${i + 1}: عدد الموافقات المطلوبة يجب أن يكون بين 1 و ${s.approverEmployeeIds.length}`;
      }
    }
  }
  return null;
}

// ─── Request subtypes ─────────────────────────────────────────────────────────


// ─── Request types ────────────────────────────────────────────────────────────

export const HR_REQUEST_TYPE_CATEGORY_LABELS_AR: Record<HRRequestTypeCategory, string> = {
  attendance: 'الحضور',
  advance: 'السلف',
};

export function normalizeRequestCategory(value: string | null | undefined): HRRequestTypeCategory {
  if (value && (HR_REQUEST_TYPE_CATEGORIES as readonly string[]).includes(value)) {
    return value as HRRequestTypeCategory;
  }
  return 'attendance';
}


// ─── Submissions ──────────────────────────────────────────────────────────────



/** لقطة مسار موافقات مرتبطة بقالب إسناد الموافقات */


// ─── Approval assignment templates ────────────────────────────────────────────


/** إسناد موافقات صفحة الانضباط: مخالفات أو أنواع طلبات */


export function approvalStageModeLabelAr(mode: HRApprovalStageMode): string {
  return approvalModeLabelAr(mode);
}

export function approvalStageStateLabelAr(state: HRSubmissionApprovalStageState): string {
  if (state === 'approved') return AR_FORMAL_APPROVAL_STATUS_LABELS.approved;
  if (state === 'rejected') return AR_STATUS.rejected;
  return AR_STATUS.pending;
}

/** ملخص سطر واحد لكل مرحلة: الحالة وليس وضع التشغيل (تتابعي/متوازي) */
export function formatApprovalStagesSummary(stages: HRSubmissionApprovalStageSnapshot[]): string {
  return stages.map((st, i) => {
    const stLabel = approvalStageStateLabelAr(st.state);
    const who = st.approverNamesAr.join('، ');
    return `المرحلة ${i + 1}: ${stLabel}${who ? ` (${who})` : ''}`;
  }).join(' · ');
}

/**
 * أول مرحلة قيد الانتظار يجب أن تُعالج الآن، والمُعتمِد الحالي ضمن قائمة المعتمدين فيها،
 * وجميع المراحل السابقة معتمدة (للمسار التتابعي وغيره).
 */
export function getApprovalActionContext(
  ap: HRSubmissionApprovalSnapshot | null | undefined,
  actingEmployeeId: string | null | undefined,
): { canAct: boolean; stageIndex: number | null } {
  if (!ap?.stages?.length || !actingEmployeeId) return { canAct: false, stageIndex: null };
  const pendingIdx = ap.stages.findIndex(s => s.state === 'pending');
  if (pendingIdx < 0) return { canAct: false, stageIndex: null };
  for (let i = 0; i < pendingIdx; i++) {
    if (ap.stages[i]!.state !== 'approved') return { canAct: false, stageIndex: null };
  }
  const cur = ap.stages[pendingIdx]!;
  const ids = cur.approverEmployeeIds ?? [];
  if (!ids.includes(actingEmployeeId)) return { canAct: false, stageIndex: null };
  return { canAct: true, stageIndex: pendingIdx };
}

/** لكل مرحلة: هل يظهر صف موافقة/رفض، وهل هو نشط (مسار تتابعي: مرحلة واحدة فقط نشطة) */
export function getPerStageApprovalUi(
  ap: HRSubmissionApprovalSnapshot | null | undefined,
  actingEmployeeId: string | null | undefined,
): {
  stageIndex: number;
  state: HRSubmissionApprovalStageState;
  canAct: boolean;
  showActionRow: boolean;
  disabledHintAr: string | null;
}[] {
  if (!ap?.stages?.length) return [];
  const firstPending = ap.stages.findIndex(s => s.state === 'pending');
  const multi = ap.stages.length >= 2;
  return ap.stages.map((st, idx) => {
    const ids = st.approverEmployeeIds ?? [];
    const isApprover = !!actingEmployeeId && ids.includes(actingEmployeeId);
    let priorApproved = true;
    for (let i = 0; i < idx; i++) {
      if (ap.stages[i]!.state !== 'approved') {
        priorApproved = false;
        break;
      }
    }
    const gate = firstPending === idx;
    const canAct =
      !!actingEmployeeId &&
      isApprover &&
      st.state === 'pending' &&
      priorApproved &&
      gate;

    let disabledHintAr: string | null = null;
    if (multi && st.state === 'pending' && isApprover && !priorApproved) {
      disabledHintAr = 'بانتظار إكمال مراحل سابقة';
    } else if (multi && st.state === 'pending' && isApprover && !gate) {
      disabledHintAr = 'مرحلة أخرى قيد المعالجة أولاً';
    } else if (multi && st.state === 'pending' && !isApprover) {
      disabledHintAr = 'لست من المعتمدين في هذه المرحلة';
    }

    const showActionRow = multi ? true : canAct;
    return { stageIndex: idx, state: st.state, canAct, showActionRow, disabledHintAr };
  });
}

export function buildApprovalSnapshotFromTemplate(
  tpl: HRApprovalAssignmentTemplate,
  resolveName: (employeeId: string) => string,
  stageStates: HRSubmissionApprovalStageState[],
): HRSubmissionApprovalSnapshot {
  const sorted = [...tpl.stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const stages: HRSubmissionApprovalStageSnapshot[] = sorted.map((s, i) => ({
    stageId: s.id,
    mode: s.mode,
    approverEmployeeIds: s.approvers.map(a => a.employeeId),
    approverNamesAr: s.approvers.map(a => resolveName(a.employeeId)),
    state: stageStates[i] ?? 'pending',
  }));
  return {
    assignmentTemplateId: tpl.id,
    assignmentTemplateNameAr: tpl.nameAr,
    stages,
  };
}

/** ملخص عرض للبطاقة: أين وصل الطلب وعدد المراحل */
export function deriveSubmissionApprovalSummary(ap: HRSubmissionApprovalSnapshot | null | undefined): {
  overall: 'in_progress' | 'approved' | 'rejected';
  totalStages: number;
  /** عدد المراحل التي أصبحت «معتمدة» — لشريط التقدم (معتمد/الإجمالي) */
  approvedStagesCount: number;
  /** أول مرحلة قيد الانتظار (1-based) للعرض النصي */
  currentStepDisplay: number;
  labelAr: string;
  /** حالة كل مرحلة والمعتمدون، وليس وضع التشغيل (تتابعي/متوازي) */
  detailAr: string;
} | null {
  if (!ap?.stages?.length) return null;
  const n = ap.stages.length;
  const approvedStagesCount = ap.stages.filter(s => s.state === 'approved').length;
  const detailAr = formatApprovalStagesSummary(ap.stages);
  const rej = ap.stages.findIndex(s => s.state === 'rejected');
  if (rej >= 0) {
    return {
      overall: 'rejected',
      totalStages: n,
      approvedStagesCount,
      currentStepDisplay: rej + 1,
      labelAr: `مرفوض — المرحلة ${rej + 1} من ${n}`,
      detailAr,
    };
  }
  const pendingIdx = ap.stages.findIndex(s => s.state === 'pending');
  if (pendingIdx < 0) {
    return {
      overall: 'approved',
      totalStages: n,
      approvedStagesCount: n,
      currentStepDisplay: n,
      labelAr: `معتمد — ${n} ${n === 1 ? 'مرحلة' : 'مراحل'}`,
      detailAr,
    };
  }
  return {
    overall: 'in_progress',
    totalStages: n,
    approvedStagesCount,
    currentStepDisplay: pendingIdx + 1,
    labelAr: `المرحلة ${pendingIdx + 1} من ${n}`,
    detailAr,
  };
}

export function templateStagesToCore(stages: HRApprovalTemplateStage[]): HRApprovalStage[] {
  return stages.map((s, i) => ({
    id: s.id,
    sortOrder: i + 1,
    mode: s.mode,
    approverEmployeeIds: s.approvers.map((a) => a.employeeId),
    parallelRule: s.parallelRule,
    optionalTimeoutHours: s.optionalTimeoutHours,
  }));
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export const HR_REQUESTS_TYPES_PATH = '/hr/requests/request-types';
export const HR_REQUESTS_APPROVAL_ASSIGNMENT_PATH = '/hr/requests/approval-assignment';

export function hrRequestPath(departmentSlug: string, requestTypeSlug: string) {
  return `/hr/requests/${departmentSlug}/${requestTypeSlug}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\s؀-ۿ]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

/** Unique API code for org entities (Arabic labels often slugify to "item"). Max 50 chars. */
export function generateEntityCode(label: string, prefix = 'item'): string {
  const slug = slugify(label);
  const stem = slug && slug !== 'item' ? slug.slice(0, 28) : prefix.slice(0, 12);
  const unique = `${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}`;
  return `${stem}-${unique}`.replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}
