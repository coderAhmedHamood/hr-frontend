export type ApprovalMode = 'sequential' | 'parallel' | 'any_one' | 'optional';

export type ApproverEntryStatus = 'pending' | 'approved' | 'rejected';

export type ApproverStateEntry = {
  employeeId: string;
  employeeNameAr: string;
  sortOrder: number;
  status: ApproverEntryStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  notes: string | null;
};

export type ApproverStatesSnapshot = {
  assignmentId: string;
  approvalMode: ApprovalMode;
  approvers: ApproverStateEntry[];
};

export type ApproverAssignmentResponseLike = {
  id: string;
  approvalMode: ApprovalMode;
  approvers: Array<Partial<ApproverStateEntry>>;
};

export type ApproverStatesCarrier = {
  approverStates?: ApproverStatesSnapshot | null;
  approver_states?: ApproverStatesSnapshot | null;
  approvalAssignment?: ApproverAssignmentResponseLike | null;
};

export type ApproverAssignmentLike = {
  id: string;
  approvalMode: ApprovalMode;
  approvers: Array<{ employeeId: string; employeeNameAr: string; sortOrder: number }>;
};

export type ApprovalWorkflowMessages = {
  notAmongApprovers: string;
  alreadyDecided: string;
  rejectedLocked: string;
  approvedByOther: string;
  waitingPriorApprovers: string;
};
