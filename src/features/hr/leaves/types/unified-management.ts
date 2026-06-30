import type { RequestApproverStatesSnapshot } from '@/features/hr/requests/lib/api/request-approver-states-types';

export type UnifiedLeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'emergency';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveApprovalStep {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  status: 'waiting' | 'pending' | 'approved' | 'rejected';
  decidedAt?: string;
}

export interface BranchPosting {
  branchId: string;
  from: string;
  to: string;
}

export interface UnifiedEmployee {
  id: string;
  nameAr: string;
  nameEn: string;
  departmentId: string;
  homeBranchId: string;
  postings: BranchPosting[];
}

export interface UnifiedLeaveRecord {
  id: string;
  employeeId: string;
  employeeNameAr?: string;
  requestTypeId?: string;
  requestTypeNameAr?: string;
  leaveTypeId: string;
  leaveTypeName: string;
  type: UnifiedLeaveType;
  status: LeaveStatus;
  start: string;
  end: string;
  requestBranchId: string;
  workingDays: number;
  noteAr?: string;
  noteEn?: string;
  subtypeSlug?: string | null;
  subtypeNameAr?: string | null;
  departmentNameAr?: string | null;
  submittedAt?: string;
  decidedAt?: string;
  cancelledAt?: string;
  decidedByEmployeeId?: string | null;
  decisionNotesAr?: string;
  approverStates: RequestApproverStatesSnapshot | null;
  approvalChain: LeaveApprovalStep[];
}

export interface EmployeeLeaveBalanceRow {
  annual: { used: number; total: number };
  sick: { used: number; total: number };
  unpaid: { used: number; total: number };
  maternity: { used: number; total: number };
  emergency: { used: number; total: number };
}

export interface UnifiedFilterState {
  branchId: string;
  departmentId: string;
  employeeIds: string[];
  status: string;
  type: string;
  approvalStage: 'all' | 'fully_approved' | 'awaiting_first' | 'awaiting_second' | 'awaiting_third';
}
