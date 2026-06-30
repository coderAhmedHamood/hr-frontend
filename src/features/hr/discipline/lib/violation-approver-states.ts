import type { ApprovalMode } from '@/features/hr/discipline/lib/api/discipline-approval-templates';
import type { DisciplineApprovalTemplateResponseDto } from '@/features/hr/discipline/lib/api/discipline-approval-templates';
import type {
  DecideViolationRecordDto,
  ViolationApproverStateEntry,
  ViolationApproverStatesSnapshot,
  ViolationRecordResponseDto,
} from '@/features/hr/discipline/lib/api/violation-records';
import {
  applyApproverDecision,
  approvalModeLabelAr,
  approverStatusLabelAr,
  buildApproverStatesFromAssignment as buildSharedApproverStatesFromAssignment,
  canEmployeeActOnApproval,
  formatApproverStatesSummary,
  getApproverActionContext,
  hasApprovalRejection,
  isEmployeeAmongApprovers,
  isEmployeeInApproverStates,
  isFullyApproved,
  normalizeApproverStates,
} from '@/shared/approval';
import { AR_APPROVAL_WORKFLOW_MESSAGES } from '@/shared/i18n/ar';

export type ViolationApproverEntryStatus = 'pending' | 'approved' | 'rejected';

const VIOLATION_MESSAGES = AR_APPROVAL_WORKFLOW_MESSAGES.violation;

export function violationApproverStatusLabelAr(status: ViolationApproverEntryStatus): string {
  return approverStatusLabelAr(status);
}

export function violationApprovalModeLabelAr(mode: ApprovalMode): string {
  return approvalModeLabelAr(mode);
}

export function isEmployeeAmongViolationApprovers(
  assignment: DisciplineApprovalTemplateResponseDto,
  employeeId: string,
): boolean {
  return isEmployeeAmongApprovers(assignment, employeeId);
}

export function normalizeViolationApproverStates(
  dto: Pick<ViolationRecordResponseDto, 'approverStates' | 'approver_states'> | null | undefined,
): ViolationApproverStatesSnapshot | null {
  return normalizeApproverStates(dto) as ViolationApproverStatesSnapshot | null;
}

export function buildApproverStatesFromAssignment(
  assignment: DisciplineApprovalTemplateResponseDto,
): ViolationApproverStatesSnapshot {
  return buildSharedApproverStatesFromAssignment(assignment) as ViolationApproverStatesSnapshot;
}

export function isViolationFullyApproved(states: ViolationApproverStatesSnapshot): boolean {
  return isFullyApproved(states);
}

export function hasViolationApprovalRejection(states: ViolationApproverStatesSnapshot): boolean {
  return hasApprovalRejection(states);
}

export function getViolationApproverActionContext(
  states: ViolationApproverStatesSnapshot,
  employeeId: string,
): { canAct: boolean; reasonAr: string | null } {
  return getApproverActionContext(states, employeeId, VIOLATION_MESSAGES);
}

export function applyViolationApproverDecision(
  states: ViolationApproverStatesSnapshot,
  employeeId: string,
  decision: 'approve' | 'reject',
  meta: { decidedBy: string | null; notes: string | null },
): ViolationApproverStatesSnapshot {
  return applyApproverDecision(states, employeeId, decision, meta) as ViolationApproverStatesSnapshot;
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
  return canEmployeeActOnApproval(states, employeeId, VIOLATION_MESSAGES);
}

export function isEmployeeInViolationApproverStates(
  states: ViolationApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): boolean {
  return isEmployeeInApproverStates(states, employeeId);
}

/** UI state for approve/reject controls — shows disabled buttons while waiting in sequential mode. */
export function getViolationApprovalUiState(
  states: ViolationApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
): { showActions: boolean; canAct: boolean; reasonAr: string | null } {
  if (!states || !employeeId) {
    return { showActions: false, canAct: false, reasonAr: null };
  }

  if (!isEmployeeInViolationApproverStates(states, employeeId)) {
    return { showActions: false, canAct: false, reasonAr: null };
  }

  const self = states.approvers.find((a) => a.employeeId === employeeId);
  if (!self || self.status !== 'pending') {
    return { showActions: false, canAct: false, reasonAr: null };
  }

  const ctx = getViolationApproverActionContext(states, employeeId);
  return {
    showActions: true,
    canAct: ctx.canAct,
    reasonAr: ctx.reasonAr,
  };
}

export function formatViolationApproverStatesSummary(states: ViolationApproverStatesSnapshot): string {
  return formatApproverStatesSummary(states);
}

export type { ViolationApproverStateEntry };
