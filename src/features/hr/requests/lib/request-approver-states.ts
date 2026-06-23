import type { RequestApprovalTemplateResponseDto } from '@/features/hr/requests/lib/api/approval-templates';
import type { RequestApprovalMode } from '@/features/hr/requests/lib/api/approval-templates';
import type {
  RequestApproverEntryStatus,
  RequestApproverStateEntry,
  RequestApproverStatesCarrier,
  RequestApproverStatesSnapshot,
} from '@/features/hr/requests/lib/api/request-approver-states-types';

const STATUS_LABELS: Record<RequestApproverEntryStatus, string> = {
  pending: 'قيد الانتظار',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

const MODE_LABELS: Record<RequestApprovalMode, string> = {
  sequential: 'تتابعي',
  parallel: 'متوازي',
  any_one: 'موافقة أحد المعتمدين',
  optional: 'اختياري',
};

export function requestApproverStatusLabelAr(status: RequestApproverEntryStatus): string {
  return STATUS_LABELS[status];
}

export function requestApprovalModeLabelAr(mode: RequestApprovalMode): string {
  return MODE_LABELS[mode];
}

export function isEmployeeAmongRequestApprovers(
  assignment: RequestApprovalTemplateResponseDto,
  employeeId: string,
): boolean {
  return assignment.approvers.some((a) => a.employeeId === employeeId);
}

export function normalizeRequestApproverStates(
  dto: RequestApproverStatesCarrier | null | undefined,
): RequestApproverStatesSnapshot | null {
  const raw = dto?.approverStates ?? dto?.approver_states ?? null;
  if (!raw || typeof raw !== 'object') return null;
  const approvers = Array.isArray(raw.approvers) ? raw.approvers : [];
  if (approvers.length === 0) return null;
  return {
    assignmentId: raw.assignmentId ?? '',
    approvalMode: raw.approvalMode ?? 'sequential',
    approvers: approvers.map((a, i) => normalizeApproverEntry(a, i)),
  };
}

function normalizeApproverEntry(
  entry: Partial<RequestApproverStateEntry>,
  fallbackOrder: number,
): RequestApproverStateEntry {
  return {
    employeeId: entry.employeeId ?? '',
    employeeNameAr: entry.employeeNameAr ?? entry.employeeId ?? '—',
    sortOrder: entry.sortOrder ?? fallbackOrder,
    status: entry.status === 'approved' || entry.status === 'rejected' ? entry.status : 'pending',
    decidedAt: entry.decidedAt ?? null,
    decidedBy: entry.decidedBy ?? null,
    notes: entry.notes ?? null,
  };
}

export function buildRequestApproverStatesFromAssignment(
  assignment: RequestApprovalTemplateResponseDto,
): RequestApproverStatesSnapshot {
  return {
    assignmentId: assignment.id,
    approvalMode: assignment.approvalMode,
    approvers: [...assignment.approvers]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((a) => ({
        employeeId: a.employeeId,
        employeeNameAr: a.employeeNameAr,
        sortOrder: a.sortOrder,
        status: 'pending' as const,
        decidedAt: null,
        decidedBy: null,
        notes: null,
      })),
  };
}

function sortedApprovers(states: RequestApproverStatesSnapshot): RequestApproverStateEntry[] {
  return [...states.approvers].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isRequestFullyApproved(states: RequestApproverStatesSnapshot): boolean {
  const approvers = sortedApprovers(states);
  if (approvers.length === 0) return false;
  if (states.approvalMode === 'any_one') {
    return approvers.some((a) => a.status === 'approved');
  }
  return approvers.every((a) => a.status === 'approved');
}

function hasRequestApprovalRejection(states: RequestApproverStatesSnapshot): boolean {
  return sortedApprovers(states).some((a) => a.status === 'rejected');
}

export function getRequestApproverActionContext(
  states: RequestApproverStatesSnapshot,
  employeeId: string,
): { canAct: boolean; reasonAr: string | null } {
  const approvers = sortedApprovers(states);
  const idx = approvers.findIndex((a) => a.employeeId === employeeId);
  if (idx === -1) {
    return { canAct: false, reasonAr: 'أنت لست ضمن المعتمدين المسندين لهذا النوع من الطلبات.' };
  }

  const self = approvers[idx]!;
  if (self.status !== 'pending') {
    return { canAct: false, reasonAr: 'تم تسجيل قرارك مسبقاً على هذا الطلب.' };
  }

  if (hasRequestApprovalRejection(states)) {
    return { canAct: false, reasonAr: 'تم رفض الطلب ولا يمكن اتخاذ قرار جديد.' };
  }

  if (states.approvalMode === 'any_one' && approvers.some((a) => a.status === 'approved')) {
    return { canAct: false, reasonAr: 'تم اعتماد الطلب من معتمد آخر.' };
  }

  if (states.approvalMode === 'sequential') {
    for (let i = 0; i < idx; i++) {
      if (approvers[i]!.status !== 'approved') {
        return { canAct: false, reasonAr: 'بانتظار موافقة المعتمدين السابقين في الترتيب.' };
      }
    }
  }

  return { canAct: true, reasonAr: null };
}

export function applyRequestApproverDecision(
  states: RequestApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  meta: { decidedBy: string | null; notes: string | null },
): RequestApproverStatesSnapshot {
  const now = new Date().toISOString();
  const status: RequestApproverEntryStatus = decision === 'approve' ? 'approved' : 'rejected';
  return {
    ...states,
    approvers: states.approvers.map((a) =>
      a.employeeId === employeeId
        ? {
            ...a,
            status,
            decidedAt: now,
            decidedBy: meta.decidedBy,
            notes: meta.notes,
          }
        : a,
    ),
  };
}

/** Payload لقرار موافقة/رفض طلب (حضور، إجازة، سلفة) */
export function buildRequestDecisionPayload(
  states: RequestApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  options: {
    decisionNotesAr?: string | null;
    updatedBy?: string | null;
  },
) {
  const notes = options.decisionNotesAr?.trim() || null;
  const updatedStates = applyRequestApproverDecision(states, employeeId, decision, {
    decidedBy: options.updatedBy ?? null,
    notes,
  });

  return {
    decision,
    approverStates: updatedStates,
    approverEmployeeId: employeeId,
    decidedByEmployeeId: employeeId,
    decisionNotesAr: notes ?? undefined,
    updatedBy: options.updatedBy ?? undefined,
  };
}

/** Payload قرار موافقة/رفض سلفة — يطابق API الرواتب */
export function buildEmployeeAdvanceDecisionPayload(
  states: RequestApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  options: {
    notes?: string | null;
    decidedBy?: string | null;
  },
) {
  const notes = options.notes?.trim() || undefined;
  const updatedStates = applyRequestApproverDecision(states, employeeId, decision, {
    decidedBy: options.decidedBy ?? null,
    notes: notes ?? null,
  });

  return {
    decision,
    approverStates: updatedStates,
    approverEmployeeId: employeeId,
    notes,
    decidedBy: options.decidedBy ?? undefined,
  };
}

/** @deprecated استخدم buildRequestDecisionPayload */
export const buildRequestCorrectionDecisionPayload = buildRequestDecisionPayload;

export function canEmployeeActOnRequestApproval(
  states: RequestApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): boolean {
  if (!states || !employeeId) return false;
  return getRequestApproverActionContext(states, employeeId).canAct;
}

export function isEmployeeInRequestApproverStates(
  states: RequestApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): boolean {
  if (!states || !employeeId) return false;
  return states.approvers.some((a) => a.employeeId === employeeId);
}
