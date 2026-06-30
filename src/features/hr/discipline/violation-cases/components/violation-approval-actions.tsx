'use client';

import {
  ApprovalActionButtons,
  ApprovalActionCell,
} from '@/features/hr/requests/components/request-approval-actions';
import { getViolationApprovalUiState } from '@/features/hr/discipline/lib/violation-approver-states';
import type { ApproverStatesSnapshot } from '@/shared/approval/types';

type BaseProps = {
  states: ApproverStatesSnapshot | null | undefined;
  currentEmployeeId: string | null | undefined;
  onApprove: () => void;
  onReject: () => void;
};

export function ViolationApprovalActionCell(
  props: BaseProps & { fallback?: React.ReactNode; className?: string },
) {
  return <ApprovalActionCell {...props} getUiState={getViolationApprovalUiState} />;
}

export function ViolationApprovalActionButtons(
  props: BaseProps & { compact?: boolean; className?: string },
) {
  return <ApprovalActionButtons {...props} getUiState={getViolationApprovalUiState} />;
}

export { getViolationApprovalUiState };
