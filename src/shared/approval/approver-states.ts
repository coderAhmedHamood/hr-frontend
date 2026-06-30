import { AR_APPROVAL_MODE_LABELS, formalApproverStatusLabelAr } from '@/shared/i18n/ar';
import type {
  ApprovalMode,
  ApprovalWorkflowMessages,
  ApproverAssignmentLike,
  ApproverEntryStatus,
  ApproverStateEntry,
  ApproverStatesCarrier,
  ApproverStatesSnapshot,
} from '@/shared/approval/types';

export function approvalModeLabelAr(mode: ApprovalMode): string {
  return AR_APPROVAL_MODE_LABELS[mode];
}

export function approverStatusLabelAr(status: ApproverEntryStatus): string {
  return formalApproverStatusLabelAr(status);
}

export function isEmployeeAmongApprovers(
  assignment: { approvers: Array<{ employeeId: string }> },
  employeeId: string,
): boolean {
  return assignment.approvers.some((a) => a.employeeId === employeeId);
}

function normalizeApproverEntry(
  entry: Partial<ApproverStateEntry>,
  fallbackOrder: number,
): ApproverStateEntry {
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

function snapshotFromRaw(
  raw: {
    assignmentId?: string;
    approvalMode?: ApprovalMode;
    approvers?: Array<Partial<ApproverStateEntry>>;
  },
  assignmentIdFallback = '',
): ApproverStatesSnapshot | null {
  const approvers = Array.isArray(raw.approvers) ? raw.approvers : [];
  if (approvers.length === 0) return null;
  return {
    assignmentId: raw.assignmentId ?? assignmentIdFallback,
    approvalMode: raw.approvalMode ?? 'sequential',
    approvers: approvers.map((a, i) => normalizeApproverEntry(a, i)),
  };
}

export function normalizeApproverStates(
  dto: ApproverStatesCarrier | null | undefined,
): ApproverStatesSnapshot | null {
  const raw = dto?.approverStates ?? dto?.approver_states ?? null;
  if (raw && typeof raw === 'object') {
    const fromStates = snapshotFromRaw(raw);
    if (fromStates) return fromStates;
  }

  const assignment = dto?.approvalAssignment;
  if (assignment && typeof assignment === 'object') {
    return snapshotFromRaw(
      {
        assignmentId: assignment.id,
        approvalMode: assignment.approvalMode,
        approvers: assignment.approvers,
      },
      assignment.id,
    );
  }

  return null;
}

export function buildApproverStatesFromAssignment(
  assignment: ApproverAssignmentLike,
): ApproverStatesSnapshot {
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

function sortedApprovers(states: ApproverStatesSnapshot): ApproverStateEntry[] {
  return [...states.approvers].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isFullyApproved(states: ApproverStatesSnapshot): boolean {
  const approvers = sortedApprovers(states);
  if (approvers.length === 0) return false;
  if (states.approvalMode === 'any_one') {
    return approvers.some((a) => a.status === 'approved');
  }
  return approvers.every((a) => a.status === 'approved');
}

export function hasApprovalRejection(states: ApproverStatesSnapshot): boolean {
  return sortedApprovers(states).some((a) => a.status === 'rejected');
}

export function getApproverActionContext(
  states: ApproverStatesSnapshot,
  employeeId: string,
  messages: ApprovalWorkflowMessages,
): { canAct: boolean; reasonAr: string | null } {
  const approvers = sortedApprovers(states);
  const idx = approvers.findIndex((a) => a.employeeId === employeeId);
  if (idx === -1) {
    return { canAct: false, reasonAr: messages.notAmongApprovers };
  }

  const self = approvers[idx]!;
  if (self.status !== 'pending') {
    return { canAct: false, reasonAr: messages.alreadyDecided };
  }

  if (hasApprovalRejection(states)) {
    return { canAct: false, reasonAr: messages.rejectedLocked };
  }

  if (states.approvalMode === 'any_one' && approvers.some((a) => a.status === 'approved')) {
    return { canAct: false, reasonAr: messages.approvedByOther };
  }

  if (states.approvalMode === 'sequential') {
    const firstPending = approvers.find((a) => a.status === 'pending');
    if (!firstPending || firstPending.employeeId !== employeeId) {
      return { canAct: false, reasonAr: messages.waitingPriorApprovers };
    }
  }

  return { canAct: true, reasonAr: null };
}

export function applyApproverDecision(
  states: ApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  meta: { decidedBy: string | null; notes: string | null },
): ApproverStatesSnapshot {
  const now = new Date().toISOString();
  const status: ApproverEntryStatus = decision === 'approve' ? 'approved' : 'rejected';
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

export function canEmployeeActOnApproval(
  states: ApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
  messages: ApprovalWorkflowMessages,
): boolean {
  if (!states || !employeeId) return false;
  return getApproverActionContext(states, employeeId, messages).canAct;
}

export function isEmployeeInApproverStates(
  states: ApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): boolean {
  if (!states || !employeeId) return false;
  return states.approvers.some((a) => a.employeeId === employeeId);
}

export function formatApproverStatesSummary(states: ApproverStatesSnapshot): string {
  return sortedApprovers(states)
    .map((a) => `${a.employeeNameAr}: ${approverStatusLabelAr(a.status)}`)
    .join(' · ');
}
