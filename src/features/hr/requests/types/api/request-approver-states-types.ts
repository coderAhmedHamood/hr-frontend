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
