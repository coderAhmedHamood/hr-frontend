export type {
  ApprovalMode,
  ApproverEntryStatus,
  ApproverStateEntry,
  ApproverStatesSnapshot,
  ApproverStatesCarrier,
  ApproverAssignmentLike,
  ApprovalWorkflowMessages,
} from '@/shared/approval/types';

export {
  approvalModeLabelAr,
  approverStatusLabelAr,
  isEmployeeAmongApprovers,
  normalizeApproverStates,
  buildApproverStatesFromAssignment,
  isFullyApproved,
  hasApprovalRejection,
  getApproverActionContext,
  applyApproverDecision,
  canEmployeeActOnApproval,
  isEmployeeInApproverStates,
  formatApproverStatesSummary,
} from '@/shared/approval/approver-states';

export {
  checkApprovalAccess,
  type ApprovalAccessMessages,
  type ApprovalAccessResult,
} from '@/shared/approval/check-approval-access';
