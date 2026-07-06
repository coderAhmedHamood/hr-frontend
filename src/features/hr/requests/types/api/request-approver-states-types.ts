import type { RequestApprovalMode } from '@/features/hr/requests/types/api/approval-templates';

export type RequestApproverEntryStatus = 'pending' | 'approved' | 'rejected';

export type RequestApproverStateEntry = {
  employeeId: string;
  employeeNameAr: string;
  sortOrder: number;
  status: RequestApproverEntryStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  notes: string | null;
};

export type RequestApproverStatesSnapshot = {
  assignmentId: string;
  approvalMode: RequestApprovalMode;
  approvers: RequestApproverStateEntry[];
};

export type RequestApprovalAssignmentDto = {
  id: string;
  approvalMode: RequestApprovalMode;
  approvers: RequestApproverStateEntry[];
};

export type RequestApproverStatesCarrier = {
  approverStates?: RequestApproverStatesSnapshot | null;
  approver_states?: RequestApproverStatesSnapshot | null;
  approvalAssignment?: RequestApprovalAssignmentDto | null;
};

/** Catalog entry returned alongside list `items` (identity only — no decision). */
export type RequestApprovalCatalogApproverDto = {
  employeeId: string;
  employeeNameAr: string;
  sortOrder: number;
};

export type RequestApprovalAssignmentCatalogDto = {
  id: string;
  approvalMode: RequestApprovalMode;
  approvers: RequestApprovalCatalogApproverDto[];
};

/** Per-approver decision overlay on list items. */
export type RequestApproverDecisionOverlayDto = {
  employeeId: string;
  status: RequestApproverEntryStatus | 'cancelled';
  decidedAt: string | null;
  notes: string | null;
};

export type RequestListItemApprovalOverlay = {
  approvalAssignmentId: string | null;
  approverDecisions: RequestApproverDecisionOverlayDto[] | null;
};
