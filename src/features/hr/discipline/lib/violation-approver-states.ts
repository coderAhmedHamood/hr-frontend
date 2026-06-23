import type { ApprovalMode } from '@/features/hr/discipline/lib/api/discipline-approval-templates';
import type { DisciplineApprovalTemplateResponseDto } from '@/features/hr/discipline/lib/api/discipline-approval-templates';
import type {
  DecideViolationRecordDto,
  ViolationApproverStateEntry,
  ViolationApproverStatesSnapshot,
  ViolationRecordResponseDto,
} from '@/features/hr/discipline/lib/api/violation-records';

export type ViolationApproverEntryStatus = 'pending' | 'approved' | 'rejected';

const STATUS_LABELS: Record<ViolationApproverEntryStatus, string> = {
  pending: 'قيد الانتظار',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

const MODE_LABELS: Record<ApprovalMode, string> = {
  sequential: 'تتابعي',
  parallel: 'متوازي',
  any_one: 'موافقة أحد المعتمدين',
  optional: 'اختياري',
};

export function violationApproverStatusLabelAr(status: ViolationApproverEntryStatus): string {
  return STATUS_LABELS[status];
}

export function violationApprovalModeLabelAr(mode: ApprovalMode): string {
  return MODE_LABELS[mode];
}

export function isEmployeeAmongViolationApprovers(
  assignment: DisciplineApprovalTemplateResponseDto,
  employeeId: string,
): boolean {
  return assignment.approvers.some((a) => a.employeeId === employeeId);
}

export function normalizeViolationApproverStates(
  dto: Pick<ViolationRecordResponseDto, 'approverStates' | 'approver_states'> | null | undefined,
): ViolationApproverStatesSnapshot | null {
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
  entry: Partial<ViolationApproverStateEntry>,
  fallbackOrder: number,
): ViolationApproverStateEntry {
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

export function buildApproverStatesFromAssignment(
  assignment: DisciplineApprovalTemplateResponseDto,
): ViolationApproverStatesSnapshot {
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

function sortedApprovers(states: ViolationApproverStatesSnapshot): ViolationApproverStateEntry[] {
  return [...states.approvers].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isViolationFullyApproved(states: ViolationApproverStatesSnapshot): boolean {
  const approvers = sortedApprovers(states);
  if (approvers.length === 0) return false;
  if (states.approvalMode === 'any_one') {
    return approvers.some((a) => a.status === 'approved');
  }
  return approvers.every((a) => a.status === 'approved');
}

export function hasViolationApprovalRejection(states: ViolationApproverStatesSnapshot): boolean {
  return sortedApprovers(states).some((a) => a.status === 'rejected');
}

export function getViolationApproverActionContext(
  states: ViolationApproverStatesSnapshot,
  employeeId: string,
): { canAct: boolean; reasonAr: string | null } {
  const approvers = sortedApprovers(states);
  const idx = approvers.findIndex((a) => a.employeeId === employeeId);
  if (idx === -1) {
    return { canAct: false, reasonAr: 'أنت لست ضمن المعتمدين المسندين لهذا النوع من المخالفات.' };
  }

  const self = approvers[idx]!;
  if (self.status !== 'pending') {
    return { canAct: false, reasonAr: 'تم تسجيل قرارك مسبقاً على هذه المخالفة.' };
  }

  if (hasViolationApprovalRejection(states)) {
    return { canAct: false, reasonAr: 'تم رفض المخالفة ولا يمكن اتخاذ قرار جديد.' };
  }

  if (states.approvalMode === 'any_one' && approvers.some((a) => a.status === 'approved')) {
    return { canAct: false, reasonAr: 'تم اعتماد المخالفة من معتمد آخر.' };
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

export function applyViolationApproverDecision(
  states: ViolationApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  meta: { decidedBy: string | null; notes: string | null },
): ViolationApproverStatesSnapshot {
  const now = new Date().toISOString();
  const status: ViolationApproverEntryStatus = decision === 'approve' ? 'approved' : 'rejected';
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

export function buildViolationDecisionPayload(
  states: ViolationApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  options: { notes?: string | null; decidedBy?: string | null },
): DecideViolationRecordDto {
  const updatedStates = applyViolationApproverDecision(states, employeeId, decision, {
    decidedBy: options.decidedBy ?? null,
    notes: options.notes?.trim() || null,
  });

  return {
    decision,
    approverStates: updatedStates,
    approverEmployeeId: employeeId,
    notes: options.notes?.trim() || null,
    decidedBy: options.decidedBy ?? null,
  };
}

export function canEmployeeActOnViolationApproval(
  states: ViolationApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): boolean {
  if (!states || !employeeId) return false;
  return getViolationApproverActionContext(states, employeeId).canAct;
}

export function isEmployeeInViolationApproverStates(
  states: ViolationApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): boolean {
  if (!states || !employeeId) return false;
  return states.approvers.some((a) => a.employeeId === employeeId);
}

export function formatViolationApproverStatesSummary(states: ViolationApproverStatesSnapshot): string {
  return sortedApprovers(states)
    .map((a) => `${a.employeeNameAr}: ${violationApproverStatusLabelAr(a.status)}`)
    .join(' · ');
}
