import type { UnifiedLeaveRecord, LeaveApprovalStep } from '@/features/hr/leaves/unified-management/types';
import { canEmployeeActOnRequestApproval } from '@/features/hr/requests/lib/request-approver-states';

export function defaultPendingApprovalChain(): LeaveApprovalStep[] {
  return [
    { id: 'step-1', nameAr: 'المدير المباشر', nameEn: 'Direct Manager', roleAr: 'مدير', roleEn: 'Manager', status: 'pending' },
    { id: 'step-2', nameAr: 'مدير الموارد البشرية', nameEn: 'HR Manager', roleAr: 'مدير HR', roleEn: 'HR Manager', status: 'waiting' },
    { id: 'step-3', nameAr: 'المدير العام', nameEn: 'General Manager', roleAr: 'مدير عام', roleEn: 'GM', status: 'waiting' },
  ];
}

export function applyStepDecision(
  leave: UnifiedLeaveRecord,
  action: 'approve' | 'reject',
): UnifiedLeaveRecord {
  if (leave.status !== 'pending') return leave;
  const chain = leave.approvalChain.map((s) => ({ ...s }));
  const idx = chain.findIndex((s) => s.status === 'pending');
  if (idx === -1) return leave;
  const now = new Date().toISOString();
  if (action === 'reject') {
    chain[idx]!.status = 'rejected';
    chain[idx]!.decidedAt = now;
    return { ...leave, approvalChain: chain, status: 'rejected' };
  }
  chain[idx]!.status = 'approved';
  chain[idx]!.decidedAt = now;
  const nextIdx = chain.findIndex((s, i) => i > idx && s.status === 'waiting');
  if (nextIdx !== -1) {
    chain[nextIdx]!.status = 'pending';
    return { ...leave, approvalChain: chain };
  }
  return { ...leave, approvalChain: chain, status: 'approved' };
}

export function canActOnLeave(leave: UnifiedLeaveRecord, currentEmployeeId?: string | null): boolean {
  if (leave.status !== 'pending') return false;
  return canEmployeeActOnRequestApproval(leave.approverStates, currentEmployeeId);
}

export function getApprovalStage(leave: UnifiedLeaveRecord): 'fully_approved' | 'awaiting_first' | 'awaiting_second' | 'awaiting_third' | 'other' {
  if (leave.status === 'approved') return 'fully_approved';
  if (leave.status !== 'pending') return 'other';

  const approvers = leave.approverStates?.approvers ?? [];
  if (approvers.length === 0) return 'awaiting_first';

  const pendingIdx = approvers.findIndex((a) => a.status === 'pending');
  if (pendingIdx === -1) return 'fully_approved';
  if (pendingIdx === 0) return 'awaiting_first';
  if (pendingIdx === 1) return 'awaiting_second';
  if (pendingIdx === 2) return 'awaiting_third';
  return 'other';
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', unpaid: 'بدون راتب', maternity: 'أمومة', emergency: 'طارئة',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار', approved: 'موافق عليه', rejected: 'مرفوض', cancelled: 'ملغاة',
};
